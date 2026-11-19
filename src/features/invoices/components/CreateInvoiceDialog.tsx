import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { LuFilePlus, LuLoaderCircle, LuTag, LuTicket } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import type { SearchSelectOption } from '@/components/ui/search-select';
import { Select } from '@/components/ui/select';
import { usePlans } from '@/features/plans/plans.hooks';
import { useSubscriptionPriceQuote } from '@/features/subscriptions/subscriptions.hooks';
import { formatPlanPeriod, formatPlanPeriodCountLabel, formatPlanPrice } from '@/lib/planFormat';
import { useCreateInvoice } from '../invoices.hooks';
import { createInvoiceSchema, DUE_IN_DAY_OPTIONS, type CreateInvoiceFormValues } from '../types';
import { BillingAccountField } from './BillingAccountField';
import { NotifyCustomerCheckbox } from './NotifyCustomerCheckbox';

const EMPTY_FORM: CreateInvoiceFormValues = {
  ownerUserId: '',
  planId: '',
  periodCount: 1,
  amount: NaN,
  discountReason: '',
  dueInDays: 7,
  notifyCustomer: true,
};

function dueInLabel(days: number): string {
  return days === 0 ? 'On receipt' : `In ${days} days`;
}

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Locks the dialog to this account, e.g. when opened from a user's row. */
  account?: SearchSelectOption | null;
}

/** Bills an account for a plan; the plan activates once the invoice is paid. */
export function CreateInvoiceDialog({
  open,
  onOpenChange,
  account = null,
}: CreateInvoiceDialogProps) {
  const [selectedOwner, setSelectedOwner] = useState<SearchSelectOption | null>(null);
  const createInvoiceMutation = useCreateInvoice();

  const form = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: EMPTY_FORM,
  });
  const { errors } = form.formState;

  // Keyed on the id, not the object, so a background refetch never wipes a half-filled form.
  const lockedAccountId = account?.id ?? '';
  useEffect(() => {
    if (!open) return;
    form.reset({ ...EMPTY_FORM, ownerUserId: lockedAccountId });
    setSelectedOwner(null);
  }, [open, lockedAccountId, form]);

  const plansQuery = usePlans({}, { enabled: open });
  // Trials are granted at signup, never sold on an invoice.
  const plans = (plansQuery.data ?? []).filter(plan => !plan.isTrial);

  const ownerUserId = form.watch('ownerUserId');
  const planId = form.watch('planId');
  const periodCount = form.watch('periodCount');
  const amount = form.watch('amount');
  const selectedPlan = plans.find(plan => plan.id === planId);
  const countLabel = selectedPlan ? formatPlanPeriodCountLabel(selectedPlan.duration) : 'Periods';

  // The server quote applies the account's referral code and any running promo,
  // so the invoice total matches what the server will check it against.
  const priceQuoteQuery = useSubscriptionPriceQuote({ ownerUserId, planId, periodCount });
  const priceQuote = priceQuoteQuery.data ?? null;
  const listTotal = selectedPlan && periodCount > 0 ? selectedPlan.price * periodCount : null;
  const quotedTotal = priceQuote?.total ?? listTotal;
  const hasAutomaticDiscount = Boolean(priceQuote?.referral || priceQuote?.promo);
  const currency = selectedPlan?.currency ?? 'PKR';

  const hasAmount = !Number.isNaN(amount);
  const isDiscounted = quotedTotal !== null && hasAmount && amount < quotedTotal;
  const isFree = hasAmount && amount === 0;

  useEffect(() => {
    if (quotedTotal !== null) form.setValue('amount', quotedTotal);
  }, [quotedTotal, form]);

  const onSubmit = (values: CreateInvoiceFormValues) => {
    createInvoiceMutation.mutate(
      {
        ownerUserId: values.ownerUserId,
        planId: values.planId,
        periodCount: values.periodCount,
        amount: values.amount,
        // Sent only when there is a gap to explain, so a full-price invoice never carries a stale reason.
        discountReason: isDiscounted ? values.discountReason?.trim() || undefined : undefined,
        dueInDays: values.dueInDays,
        notifyCustomer: values.notifyCustomer,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Create invoice" size="sm">
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        <BillingAccountField
          lockedAccount={account}
          selectedAccount={selectedOwner}
          onSelectAccount={owner => {
            setSelectedOwner(owner);
            form.setValue('ownerUserId', owner?.id ?? '', { shouldValidate: true });
            form.setValue('planId', '');
          }}
          isEnabled={open}
          errorMessage={errors.ownerUserId?.message}
        />

        <Field label="Pricing plan" required error={errors.planId?.message}>
          <Select disabled={!ownerUserId} invalid={!!errors.planId} {...form.register('planId')}>
            <option value="">
              {!ownerUserId
                ? 'Pick an account first'
                : plans.length === 0
                  ? 'No plans available'
                  : 'Select a plan'}
            </option>
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name}: {formatPlanPrice(plan.price, plan.currency)}/
                {formatPlanPeriod(plan.duration, plan.customDurationDays)}
              </option>
            ))}
          </Select>
        </Field>

        <Controller
          control={form.control}
          name="periodCount"
          render={({ field, fieldState }) => (
            <Field
              label={`${countLabel} billed`}
              error={fieldState.error?.message}
              hint={
                selectedPlan
                  ? `Grants ${periodCount} × ${formatPlanPeriod(
                      selectedPlan.duration,
                      selectedPlan.customDurationDays
                    )} once paid.`
                  : 'How many plan periods this invoice covers.'
              }
            >
              <Input
                type="number"
                min={1}
                max={60}
                step={1}
                disabled={!planId}
                invalid={!!fieldState.error}
                value={Number.isNaN(field.value) ? '' : field.value}
                onChange={event =>
                  field.onChange(
                    Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber
                  )
                }
              />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="amount"
          render={({ field, fieldState }) => (
            <Field label="Invoice total" required error={fieldState.error?.message}>
              <Input
                type="number"
                min={0}
                placeholder="Amount"
                disabled={!planId}
                invalid={!!fieldState.error}
                value={Number.isNaN(field.value) ? '' : field.value}
                onChange={event => field.onChange(event.target.valueAsNumber)}
              />
            </Field>
          )}
        />

        {hasAutomaticDiscount && priceQuote && (
          <div className="space-y-1.5 rounded-lg border border-success/30 bg-success/5 p-3 text-xs text-default-600">
            {priceQuote.referral && (
              <p className="flex items-center gap-1.5">
                <LuTicket className="size-3.5 shrink-0 text-success" />
                Referred by {priceQuote.referral.affiliateName} with{' '}
                <span className="font-mono font-semibold">{priceQuote.referral.code}</span>:{' '}
                {priceQuote.referral.discountPercent}% off applied.
              </p>
            )}
            {priceQuote.promo && (
              <p className="flex items-center gap-1.5">
                <LuTag className="size-3.5 shrink-0 text-success" />
                {priceQuote.promo.title}: {priceQuote.promo.discountPercent}% off applied.
              </p>
            )}
            <p className="tabular-nums">
              <span className="text-default-400 line-through">
                {formatPlanPrice(priceQuote.listTotal, priceQuote.currency)}
              </span>{' '}
              <span className="text-sm font-semibold text-default-900">
                {formatPlanPrice(priceQuote.total, priceQuote.currency)}
              </span>{' '}
              to bill
            </p>
          </div>
        )}

        {isDiscounted && selectedPlan && quotedTotal !== null && (
          <div className="rounded-lg border border-info/30 bg-info/5 p-3">
            <p className="text-xs text-default-600">
              {formatPlanPrice(quotedTotal - amount, currency)} below the {selectedPlan.name} price
              of {formatPlanPrice(quotedTotal, currency)}.
            </p>
            <Input
              className="mt-2"
              placeholder="Why? e.g. Eid campaign, loyalty discount"
              aria-label="Reason for the reduced price"
              {...form.register('discountReason')}
            />
            <p className="mt-1.5 text-xs text-default-400">
              Printed on the invoice as a price note.
            </p>
          </div>
        )}

        <Field label="Payment due">
          <Select {...form.register('dueInDays', { valueAsNumber: true })} disabled={isFree}>
            {DUE_IN_DAY_OPTIONS.map(days => (
              <option key={days} value={days}>
                {dueInLabel(days)}
              </option>
            ))}
          </Select>
        </Field>

        <Controller
          control={form.control}
          name="notifyCustomer"
          render={({ field }) => (
            <NotifyCustomerCheckbox
              checked={field.value}
              onChange={event => field.onChange(event.target.checked)}
              description={
                isFree
                  ? 'Tells them the plan is active.'
                  : 'Sends the invoice total and due date to their notifications and inbox.'
              }
            />
          )}
        />

        <p className="text-xs text-default-400">
          {isFree
            ? 'Nothing to collect, so this invoice is settled and the plan activates as soon as it is created.'
            : 'The plan activates once a payment is made against this invoice.'}
        </p>

        <Button type="submit" className="w-full" disabled={createInvoiceMutation.isPending}>
          {createInvoiceMutation.isPending ? (
            <LuLoaderCircle className="size-4 me-1.5 animate-spin" />
          ) : (
            <LuFilePlus className="size-4 me-1.5" />
          )}
          {createInvoiceMutation.isPending
            ? 'Creating…'
            : isFree
              ? 'Create and activate'
              : 'Create invoice'}
        </Button>
      </form>
    </Modal>
  );
}
