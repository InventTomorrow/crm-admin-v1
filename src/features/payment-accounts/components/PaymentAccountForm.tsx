import { useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { LuLandmark } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ToggleRow } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useSavePaymentAccount } from '../accounts.hooks';
import {
  accountDisplayName,
  BANK_NAME_FIELD_LABEL,
  isBankNameRequiredFor,
  normalizeIban,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  paymentAccountSchema,
  type PaymentAccount,
  type PaymentAccountFormValues,
} from '../types';
import { MaskedAccountInput } from './MaskedAccountInput';

const emptyValues: PaymentAccountFormValues = {
  method: 'BANK_TRANSFER',
  accountTitle: '',
  accountNumber: '',
  bankName: '',
  iban: '',
  branchCode: '',
  instructions: '',
  isActive: true,
};

const toFormValues = (account: PaymentAccount): PaymentAccountFormValues => ({
  method: account.method,
  accountTitle: account.accountTitle,
  accountNumber: account.accountNumber,
  bankName: account.bankName ?? '',
  iban: account.iban ?? '',
  branchCode: account.branchCode ?? '',
  instructions: account.instructions ?? '',
  isActive: account.isActive,
});

interface PaymentAccountFormProps {
  /** Null when adding — the same form handles both. */
  account: PaymentAccount | null;
  onClose: () => void;
}

/**
 * Inline add/edit panel above the account list. The method comes first: the
 * wording and the rules of the fields below it (wallet vs account number, bank
 * name vs wallet provider) all follow from which method was picked.
 */
export function PaymentAccountForm({ account, onClose }: PaymentAccountFormProps) {
  const saveMutation = useSavePaymentAccount();
  const panelRef = useRef<HTMLDivElement>(null);

  // The panel sits above the list — an Edit clicked further down would
  // otherwise open off-screen.
  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const form = useForm<PaymentAccountFormValues>({
    resolver: zodResolver(paymentAccountSchema),
    defaultValues: account ? toFormValues(account) : emptyValues,
    // Each field reports as soon as it has been visited, rather than holding
    // every message back until the first save.
    mode: 'onTouched',
  });
  const { errors } = form.formState;

  const selectedMethod = form.watch('method');
  const isBankAccount = selectedMethod === 'BANK_TRANSFER';
  const bankNameLabel = BANK_NAME_FIELD_LABEL[selectedMethod];
  const isBankNameRequired = isBankNameRequiredFor(selectedMethod);

  // Both the number and the bank name are validated against the method, so
  // values entered under one method have to be re-checked when it changes.
  useEffect(() => {
    if (form.getValues('accountNumber')) void form.trigger('accountNumber');
    if (form.formState.touchedFields.bankName) void form.trigger('bankName');
  }, [selectedMethod, form]);

  const submit = form.handleSubmit(values =>
    saveMutation.mutate(
      {
        ...(account ? { id: account.id } : {}),
        input: {
          method: values.method,
          accountTitle: values.accountTitle.trim(),
          accountNumber: values.accountNumber.trim(),
          // Empty means "unset" rather than an empty string on the public page.
          bankName: values.bankName.trim() || null,
          iban: normalizeIban(values.iban) || null,
          branchCode: values.branchCode.trim() || null,
          instructions: values.instructions.trim() || null,
          isActive: values.isActive,
        },
      },
      { onSuccess: onClose }
    )
  );

  return (
    <div ref={panelRef} className="card mb-5">
      <div className="card-header">
        <h6 className="card-title flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LuLandmark className="size-4" />
          </span>
          {account ? `Edit ${accountDisplayName(account)}` : 'Add payment account'}
        </h6>
        <p className="mt-1 text-sm text-default-500">
          These details appear on the public checkout page as the account to transfer into.
        </p>
      </div>

      <form onSubmit={submit} noValidate className="card-body">
        <FormSection
          title="Method & institution"
          hint="Where the money lands — this is what the account is listed under."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Method" htmlFor="account-method" required error={errors.method?.message}>
              <Select id="account-method" invalid={!!errors.method} {...form.register('method')}>
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label={bankNameLabel}
              htmlFor="account-bank"
              required={isBankNameRequired}
              error={errors.bankName?.message}
            >
              <Input
                id="account-bank"
                autoFocus
                placeholder={isBankAccount ? 'Habib Bank Limited' : 'Easypaisa'}
                invalid={!!errors.bankName}
                {...form.register('bankName')}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Account details" hint="Exactly as the customer must enter them." separated>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Account title"
              htmlFor="account-title"
              required
              hint="The name the transfer must be made out to."
              error={errors.accountTitle?.message}
            >
              <Input
                id="account-title"
                placeholder="AsaanRabta (Pvt) Ltd"
                invalid={!!errors.accountTitle}
                {...form.register('accountTitle')}
              />
            </Field>
            <Field
              label={isBankAccount ? 'Account number' : 'Wallet number'}
              htmlFor="account-number"
              required
              error={errors.accountNumber?.message}
            >
              <Controller
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <MaskedAccountInput
                    id="account-number"
                    revealLabel={isBankAccount ? 'account number' : 'wallet number'}
                    placeholder={isBankAccount ? '1234-5678-9012-3456' : '0300-0000000'}
                    invalid={!!errors.accountNumber}
                    {...field}
                  />
                )}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="IBAN & branch" hint="Optional — shown when filled." separated>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="IBAN" htmlFor="account-iban" error={errors.iban?.message}>
              <Controller
                control={form.control}
                name="iban"
                render={({ field }) => (
                  <MaskedAccountInput
                    id="account-iban"
                    revealLabel="IBAN"
                    placeholder="PK00HABB0000000000000000"
                    invalid={!!errors.iban}
                    {...field}
                  />
                )}
              />
            </Field>
            <Field label="Branch code" htmlFor="account-branch" error={errors.branchCode?.message}>
              <Input
                id="account-branch"
                placeholder="0123"
                invalid={!!errors.branchCode}
                {...form.register('branchCode')}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Note for the customer" separated>
          <Field
            htmlFor="account-instructions"
            hint="Shown under this account on the checkout page."
            error={errors.instructions?.message}
          >
            <Textarea
              id="account-instructions"
              rows={2}
              placeholder="Send the exact amount and upload the screenshot below."
              invalid={!!errors.instructions}
              {...form.register('instructions')}
            />
          </Field>
        </FormSection>

        <FormSection title="Visibility" separated>
          <ToggleRow
            label="Show on checkout"
            description="Turn off to hide without deleting."
            {...form.register('isActive')}
          />
          {!account && (
            <p className="mt-3 text-xs text-default-500">
              New accounts are added to the end of the list — use the arrows there to reorder them.
            </p>
          )}
        </FormSection>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-default-200 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saveMutation.isPending}>
            {account ? 'Save changes' : 'Add account'}
          </Button>
        </div>
      </form>
    </div>
  );
}

/** Titled block of fields; `separated` draws the rule that splits it from the block above. */
function FormSection({
  title,
  hint,
  separated,
  children,
}: {
  title: string;
  hint?: string;
  separated?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={separated ? 'mt-5 border-t border-default-200 pt-5' : undefined}>
      <h6 className="text-sm font-semibold text-default-800">{title}</h6>
      {hint && <p className="mt-0.5 mb-3 text-xs text-default-500">{hint}</p>}
      <div className={hint ? undefined : 'mt-3'}>{children}</div>
    </section>
  );
}
