import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { LuLoaderCircle, LuPlus } from 'react-icons/lu';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { SearchSelectOption } from '@/components/ui/search-select';
import { Modal } from '@/components/ui/modal';
import { listPlans } from '@/features/plans/plans.api';
import { CrmUserSearchSelect } from '@/features/users/components/CrmUserSearchSelect';
import { formatPlanPeriod, formatPlanPrice } from '@/lib/planFormat';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from '../subscriptions.api';
import { useCreateSubscription } from '../subscriptions.hooks';
import { createSubscriptionSchema, type CreateSubscriptionFormValues } from '../types';
import { Button } from '@/components/ui/button';

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
      method: 'BANK_TRANSFER',
      amount: NaN as unknown as number,
      reference: '',
    },
  });
  const { errors } = form.formState;

  const plansQuery = useQuery({ queryKey: ['plans'], queryFn: listPlans, enabled: open });
  const plans = plansQuery.data ?? [];

  const ownerUserId = form.watch('ownerUserId');
  const planId = form.watch('planId');
  const amount = form.watch('amount');
  const selectedPlan = plans.find(plan => plan.id === planId);
  // Charging under the list price is allowed, but it has to be accounted for —
  // the server rejects an unexplained shortfall no live campaign covers.
  const isDiscounted = !!selectedPlan && !Number.isNaN(amount) && amount < selectedPlan.price;

  // Default the amount to the plan's price; the admin can still override it
  // if they collected a different figure.
  useEffect(() => {
    if (selectedPlan) form.setValue('amount', selectedPlan.price);
  }, [selectedPlan, form]);

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
                  {plan.name} — {formatPlanPrice(plan.price, plan.currency)}/
                  {formatPlanPeriod(plan.duration, plan.customDurationDays)}
                  {plan.isTrial ? ' · trial' : ''}
                </option>
              ))}
            </Select>
          </Field>

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

            {isDiscounted && (
              <div className="mt-2.5 rounded-lg border border-info/30 bg-info/5 p-3">
                <p className="text-xs text-default-600">
                  {formatPlanPrice(selectedPlan.price - amount, selectedPlan.currency)} below the{' '}
                  {selectedPlan.name} price of{' '}
                  {formatPlanPrice(selectedPlan.price, selectedPlan.currency)}.
                </p>
                <Input
                  className="mt-2"
                  placeholder="Why? e.g. Eid campaign, loyalty discount"
                  aria-label="Reason for the reduced price"
                  {...form.register('discountReason')}
                />
                <p className="mt-1.5 text-xs text-default-400">
                  Shown on the subscriptions table. A running campaign that matches the amount fills
                  this in on its own.
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
