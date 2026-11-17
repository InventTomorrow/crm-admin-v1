import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import type { SearchSelectOption } from '@/components/ui/search-select';
import { Select } from '@/components/ui/select';
import { usePlans } from '@/features/plans/plans.hooks';
import { CrmUserSearchSelect } from '@/features/users/components/CrmUserSearchSelect';
import { formatPlanPeriod, formatPlanPeriodCountLabel, formatPlanPrice } from '@/lib/planFormat';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { LuLoaderCircle, LuPlus, LuTag, LuTicket } from 'react-icons/lu';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from '../subscriptions.api';
import { useCreateSubscription, useSubscriptionPriceQuote } from '../subscriptions.hooks';
import { createSubscriptionSchema, type CreateSubscriptionFormValues } from '../types';

/**
 * Workflow 1 — admin-initiated. A subscription belongs to the CRM account
 * owner, not a workspace: that one subscription covers every workspace they
 * create, up to the plan's maxWorkspaces. So the only party to pick is the user.
 */
export function CreateSubscriptionDialog() {
  const [open, setOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<SearchSelectOption | null>(null);
  const createSubscriptionMutation = useCreateSubscription();

  const form = useForm<CreateSubscriptionFormValues>({
    resolver: zodResolver(createSubscriptionSchema),
    defaultValues: {
      ownerUserId: '',
      planId: '',
      periodCount: 1,
      method: 'BANK_TRANSFER',
      amount: NaN as unknown as number,
      reference: '',
    },
  });
  const { errors } = form.formState;

  const plansQuery = usePlans({}, { enabled: open });
  const plans = plansQuery.data ?? [];

  const ownerUserId = form.watch('ownerUserId');
  const planId = form.watch('planId');
  const periodCount = form.watch('periodCount');
  const amount = form.watch('amount');
  const selectedPlan = plans.find(plan => plan.id === planId);
  const countLabel = selectedPlan ? formatPlanPeriodCountLabel(selectedPlan.duration) : 'Periods';

  // The server quote applies the account's referral code and any running promo,
  // so the admin collects exactly what the server will check the payment against.
  const priceQuoteQuery = useSubscriptionPriceQuote({ ownerUserId, planId, periodCount });
  const priceQuote = priceQuoteQuery.data ?? null;
  const listTotal = selectedPlan && periodCount > 0 ? selectedPlan.price * periodCount : null;
  const totalDue = priceQuote?.total ?? listTotal;
  const hasAutomaticDiscount = Boolean(priceQuote?.referral || priceQuote?.promo);

  // Charging under the quoted total is allowed, but the server wants the gap explained.
  const isDiscounted = totalDue !== null && !Number.isNaN(amount) && amount < totalDue;

  // Default the amount to what the span costs; the admin can still override it
  // if they collected a different figure.
  useEffect(() => {
    if (totalDue !== null) form.setValue('amount', totalDue);
  }, [totalDue, form]);

  const closeAndReset = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset();
      setSelectedOwner(null);
    }
  };

  const onSubmit = (values: CreateSubscriptionFormValues) => {
    if (!selectedPlan) return;
    createSubscriptionMutation.mutate(
      {
        ownerUserId: values.ownerUserId,
        planId: values.planId,
        periodCount: values.periodCount,
        payment: {
          method: values.method,
          amount: values.amount,
          currency: selectedPlan.currency ?? 'PKR',
          reference: values.reference?.trim() || undefined,
          // Sent only when there is a gap to explain, so a full-price payment
          // never carries a stale reason from an abandoned edit.
          discountReason: isDiscounted ? values.discountReason?.trim() || undefined : undefined,
        },
      },
      { onSuccess: () => closeAndReset(false) }
    );
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <LuPlus className="size-4 me-1" /> Assign plan
      </Button>

      <Modal open={open} onOpenChange={closeAndReset} title="Assign a plan to an account" size="sm">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Controller
            control={form.control}
            name="ownerUserId"
            render={({ field, fieldState }) => (
              <Field label="CRM account owner" required error={fieldState.error?.message}>
                <CrmUserSearchSelect
                  value={selectedOwner}
                  onSelect={owner => {
                    setSelectedOwner(owner);
                    field.onChange(owner?.id ?? '');
                    form.setValue('planId', '');
                  }}
                  enabled={open}
                  invalid={!!fieldState.error}
                />
              </Field>
            )}
          />

          <Field label="Plan" required error={errors.planId?.message}>
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
                  {plan.isTrial ? ' · trial' : ''}
                </option>
              ))}
            </Select>
          </Field>

          <Controller
            control={form.control}
            name="periodCount"
            render={({ field, fieldState }) => (
              <Field
                label={`${countLabel} bought`}
                error={fieldState.error?.message}
                hint={
                  totalDue !== null && selectedPlan
                    ? `Grants ${periodCount} × ${formatPlanPeriod(
                        selectedPlan.duration,
                        selectedPlan.customDurationDays
                      )} for ${formatPlanPrice(totalDue, selectedPlan.currency)} in total.`
                    : 'How many plan periods this payment covers.'
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

          <div>
            <span className="form-label mb-2 block text-sm font-medium text-default-700">
              Payment received
            </span>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Select aria-label="Payment method" {...form.register('method')}>
                {PAYMENT_METHODS.map(paymentMethod => (
                  <option key={paymentMethod} value={paymentMethod}>
                    {PAYMENT_METHOD_LABELS[paymentMethod]}
                  </option>
                ))}
              </Select>
              <Controller
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                  <div>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Amount"
                      aria-label="Amount"
                      invalid={!!fieldState.error}
                      value={Number.isNaN(field.value) ? '' : field.value}
                      onChange={event =>
                        field.onChange(
                          Number.isNaN(event.target.valueAsNumber)
                            ? NaN
                            : event.target.valueAsNumber
                        )
                      }
                    />
                    {fieldState.error && (
                      <p className="mt-1 text-sm text-danger">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
            <Input
              className="mt-2.5"
              placeholder="Transaction reference (optional)"
              {...form.register('reference')}
            />

            {hasAutomaticDiscount && priceQuote && (
              <div className="mt-2.5 space-y-1.5 rounded-lg border border-success/30 bg-success/5 p-3 text-xs text-default-600">
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
                  to collect
                </p>
              </div>
            )}

            {isDiscounted && selectedPlan && totalDue !== null && (
              <div className="mt-2.5 rounded-lg border border-info/30 bg-info/5 p-3">
                <p className="text-xs text-default-600">
                  {formatPlanPrice(totalDue - amount, selectedPlan.currency)} below the{' '}
                  {selectedPlan.name} price of {formatPlanPrice(totalDue, selectedPlan.currency)}.
                </p>
                <Input
                  className="mt-2"
                  placeholder="Why? e.g. Eid campaign, loyalty discount"
                  aria-label="Reason for the reduced price"
                  {...form.register('discountReason')}
                />
                <p className="mt-1.5 text-xs text-default-400">
                  Shown on the subscriptions table. Referral codes and running campaigns are already
                  included in the amount above.
                </p>
              </div>
            )}

            <p className="mt-1.5 text-xs text-default-400">
              The subscription activates immediately.
              {selectedPlan?.isTrial ? ' Trial plans start as Trialing.' : ''}
            </p>
          </div>

          <Button
            type="submit"
            className="mt-2 w-full"
            disabled={createSubscriptionMutation.isPending}
          >
            {createSubscriptionMutation.isPending && (
              <LuLoaderCircle className="size-4 me-1.5 animate-spin" />
            )}
            {createSubscriptionMutation.isPending ? 'Creating…' : 'Create subscription'}
          </Button>
        </form>
      </Modal>
    </>
  );
}
