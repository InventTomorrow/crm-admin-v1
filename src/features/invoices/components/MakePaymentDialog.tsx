import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { LuFilePlus, LuFileText, LuLoaderCircle, LuWallet } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import type { SearchSelectOption } from '@/components/ui/search-select';
import { Select } from '@/components/ui/select';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from '@/features/subscriptions/subscriptions.api';
import { formatPlanPrice } from '@/lib/planFormat';
import { useOpenInvoices, useRecordInvoicePayment } from '../invoices.hooks';
import { recordPaymentSchema, type RecordPaymentFormValues } from '../types';
import { BillingAccountField } from './BillingAccountField';
import { NotifyCustomerCheckbox } from './NotifyCustomerCheckbox';
import { OpenInvoicePicker } from './OpenInvoicePicker';

const EMPTY_FORM: RecordPaymentFormValues = {
  invoiceId: '',
  method: 'BANK_TRANSFER',
  reference: '',
  notifyCustomer: true,
};

interface MakePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Locks the dialog to this account, e.g. when opened from a user's row. */
  account?: SearchSelectOption | null;
  /** Preselects this invoice, e.g. from an invoice row; otherwise the latest unpaid one. */
  invoiceId?: string;
  /** Shown when the account has nothing to pay, since a payment always settles an invoice. */
  onCreateInvoice?: (account: SearchSelectOption) => void;
}

/** Makes a payment against one of the account's unpaid invoices and activates its plan. */
export function MakePaymentDialog({
  open,
  onOpenChange,
  account = null,
  invoiceId: preselectedInvoiceId,
  onCreateInvoice,
}: MakePaymentDialogProps) {
  const [selectedOwner, setSelectedOwner] = useState<SearchSelectOption | null>(null);
  const recordPaymentMutation = useRecordInvoicePayment();
  const form = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: EMPTY_FORM,
  });
  const { errors } = form.formState;

  const lockedAccountId = account?.id ?? '';
  useEffect(() => {
    if (!open) return;
    form.reset(EMPTY_FORM);
    setSelectedOwner(null);
  }, [open, lockedAccountId, form]);

  const billedAccount = account ?? selectedOwner;
  const ownerUserId = billedAccount?.id ?? '';
  const openInvoicesQuery = useOpenInvoices(ownerUserId, { enabled: open });
  // Placeholder rows belong to the previously picked account, so they are never offered here.
  const openInvoices = useMemo(
    () => (openInvoicesQuery.isPlaceholderData ? [] : (openInvoicesQuery.data?.items ?? [])),
    [openInvoicesQuery.isPlaceholderData, openInvoicesQuery.data]
  );

  const invoiceId = form.watch('invoiceId');
  const selectedInvoice = openInvoices.find(invoice => invoice.id === invoiceId) ?? null;

  // Defaults to the latest unpaid invoice whenever the current pick is not in the list.
  useEffect(() => {
    if (openInvoices.length === 0 || selectedInvoice) return;
    const preselected = openInvoices.find(invoice => invoice.id === preselectedInvoiceId);
    form.setValue('invoiceId', (preselected ?? openInvoices[0]).id, { shouldValidate: true });
  }, [openInvoices, selectedInvoice, preselectedInvoiceId, form]);

  const onSubmit = (values: RecordPaymentFormValues) => {
    recordPaymentMutation.mutate(
      {
        invoiceId: values.invoiceId,
        method: values.method,
        reference: values.reference?.trim() || undefined,
        notifyCustomer: values.notifyCustomer,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const isLoadingInvoices =
    Boolean(ownerUserId) && openInvoicesQuery.isFetching && openInvoices.length === 0;
  const hasNoOpenInvoices =
    Boolean(ownerUserId) &&
    openInvoicesQuery.isSuccess &&
    !openInvoicesQuery.isPlaceholderData &&
    openInvoices.length === 0;

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Make a payment" size="sm">
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        <BillingAccountField
          lockedAccount={account}
          selectedAccount={selectedOwner}
          onSelectAccount={owner => {
            setSelectedOwner(owner);
            form.setValue('invoiceId', '');
          }}
          isEnabled={open}
        />

        {!ownerUserId ? null : isLoadingInvoices ? (
          <div className="h-24 animate-pulse rounded-lg bg-default-100" />
        ) : openInvoicesQuery.isError ? (
          <p className="rounded-lg border border-default-200 px-3 py-4 text-center text-sm text-default-500">
            Could not load unpaid invoices.{' '}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => openInvoicesQuery.refetch()}
            >
              Retry
            </button>
          </p>
        ) : hasNoOpenInvoices ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-default-300 px-4 py-6 text-center">
            <span className="mb-2 flex size-10 items-center justify-center rounded-full bg-default-100 text-default-400">
              <LuFileText className="size-5" />
            </span>
            <p className="text-sm font-medium text-default-800">No unpaid invoices</p>
            <p className="mt-1 text-xs text-default-500">
              A payment is always made against an invoice. Create one first.
            </p>
            {onCreateInvoice && billedAccount && (
              <Button
                type="button"
                size="sm"
                className="mt-3"
                onClick={() => onCreateInvoice(billedAccount)}
              >
                <LuFilePlus className="size-4 me-1" /> Create invoice
              </Button>
            )}
          </div>
        ) : (
          <>
            <Field
              label="Invoice being paid"
              required
              error={errors.invoiceId?.message}
              hint={
                openInvoices.length > 1
                  ? `${openInvoices.length} unpaid invoices on this account.`
                  : undefined
              }
            >
              <OpenInvoicePicker
                invoices={openInvoices}
                selectedInvoiceId={invoiceId}
                onSelect={pickedInvoiceId =>
                  form.setValue('invoiceId', pickedInvoiceId, { shouldValidate: true })
                }
              />
            </Field>

            <div>
              <span className="form-label mb-2 block text-sm font-medium text-default-700">
                Payment received
              </span>
              <Select aria-label="Payment method" {...form.register('method')}>
                {PAYMENT_METHODS.map(paymentMethod => (
                  <option key={paymentMethod} value={paymentMethod}>
                    {PAYMENT_METHOD_LABELS[paymentMethod]}
                  </option>
                ))}
              </Select>
              <Input
                className="mt-2.5"
                placeholder="Transaction reference (optional)"
                invalid={!!errors.reference}
                {...form.register('reference')}
              />
              {errors.reference && (
                <p className="mt-1 text-sm text-danger">{errors.reference.message}</p>
              )}
            </div>

            <Controller
              control={form.control}
              name="notifyCustomer"
              render={({ field }) => (
                <NotifyCustomerCheckbox
                  checked={field.value}
                  onChange={event => field.onChange(event.target.checked)}
                  description="Sends a payment receipt and the plan's new end date to their notifications and inbox."
                />
              )}
            />

            <p className="text-xs text-default-400">
              The full invoice total is paid, the invoice is marked paid and its plan activates
              immediately.
            </p>
          </>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={!selectedInvoice || recordPaymentMutation.isPending}
        >
          {recordPaymentMutation.isPending ? (
            <LuLoaderCircle className="size-4 me-1.5 animate-spin" />
          ) : (
            <LuWallet className="size-4 me-1.5" />
          )}
          {recordPaymentMutation.isPending
            ? 'Making payment…'
            : selectedInvoice
              ? `Make payment of ${formatPlanPrice(selectedInvoice.amount, selectedInvoice.currency)}`
              : 'Make payment'}
        </Button>
      </form>
    </Modal>
  );
}
