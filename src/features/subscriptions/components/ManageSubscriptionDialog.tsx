import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { listPlans } from '@/features/plans/plans.api';
import { formatDate } from '@/lib/format';
import {
  addPlanPeriods,
  countPlanPeriods,
  formatPlanPeriod,
  formatPlanPeriodCountLabel,
  formatPlanPrice,
} from '@/lib/planFormat';
import { ToggleRow } from '@/components/ui/switch';
import type { Plan, Subscription } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from '../subscriptions.api';
import { useManageSubscription } from '../subscriptions.hooks';

/** Date-only ISO, so a picked day isn't shifted by the browser's timezone. */
function toIsoDate(date: Date): string {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();
}

function toDate(value: string | null): Date | null {
  return value ? new Date(value) : null;
}

/**
 * Moves a subscription to a different plan and/or re-dates its billing period.
 * Extending the period is how a manual-mode customer gets renewed — there is no
 * gateway to do it automatically — so the normal path is the period count
 * ("2 months of Pro") and the end date derives from it. The end date stays
 * editable behind a toggle for the odd period that doesn't divide evenly.
 */
export function ManageSubscriptionDialog({
  subscription,
  open,
  onClose,
}: {
  subscription: Subscription | null;
  open: boolean;
  onClose: () => void;
}) {
  const manageMutation = useManageSubscription();
  const [planId, setPlanId] = useState('');
  const [periodStart, setPeriodStart] = useState<Date | null>(null);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);
  const [periodCount, setPeriodCount] = useState('1');
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [isEndDateEditable, setIsEndDateEditable] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>(
    'BANK_TRANSFER'
  );
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [discountReason, setDiscountReason] = useState('');

  const plansQuery = useQuery({ queryKey: ['plans'], queryFn: listPlans, enabled: open });
  const plans = plansQuery.data ?? [];
  const selectedPlan = plans.find(plan => plan.id === planId) ?? null;

  // Re-seed whenever a different row opens the dialog. The count is read back
  // out of the dates already on the record, so an untouched dialog saves nothing.
  useEffect(() => {
    if (!open || !subscription) return;
    setPlanId(subscription.planId);
    setPeriodStart(toDate(subscription.currentPeriodStart));
    setPeriodEnd(toDate(subscription.currentPeriodEnd));
    setTrialEndsAt(toDate(subscription.trialEndsAt));
    setIsEndDateEditable(false);
    setIsRecordingPayment(false);
    setPaymentMethod('BANK_TRANSFER');
    setPaymentReference('');
    setDiscountReason('');
  }, [open, subscription]);

  // Plans arrive after the seed above, and the count needs the plan's duration
  // to be read back out of the dates.
  useEffect(() => {
    if (!open || !subscription || !selectedPlan) return;
    const start = toDate(subscription.currentPeriodStart);
    const end = toDate(subscription.currentPeriodEnd);
    const seeded =
      start && end
        ? countPlanPeriods(start, end, selectedPlan.duration, selectedPlan.customDurationDays)
        : null;
    setPeriodCount(String(seeded ?? 1));
    // Only the record's own plan describes the record's own dates; a plan the
    // admin then picks by hand goes through resolveEnd instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subscription, plansQuery.data]);

  // Moving an account onto a paid plan by hand normally means money was taken
  // outside the checkout flow, so the payment fields open ready to fill.
  useEffect(() => {
    if (!open || !subscription || !selectedPlan) return;
    const periods = Number(periodCount);
    const due = Number.isInteger(periods) && periods > 0 ? selectedPlan.price * periods : null;
    if (due !== null) setPaymentAmount(String(due));
    if (planId !== subscription.planId && selectedPlan.price > 0) setIsRecordingPayment(true);
  }, [open, subscription, selectedPlan, planId, periodCount]);

  if (!subscription) return null;

  const resolveEnd = (start: Date | null, count: string, plan: Plan | null): Date | null => {
    if (!start || !plan) return null;
    const periods = Number(count);
    if (!Number.isInteger(periods) || periods <= 0) return null;
    return addPlanPeriods(start, plan.duration, plan.customDurationDays, periods);
  };

  const handlePlanChange = (nextPlanId: string) => {
    setPlanId(nextPlanId);
    const nextPlan = plans.find(plan => plan.id === nextPlanId) ?? null;
    const nextEnd = resolveEnd(periodStart, periodCount, nextPlan);
    if (nextEnd) setPeriodEnd(nextEnd);
  };

  const handleStartChange = (nextStart: Date | null) => {
    setPeriodStart(nextStart);
    const nextEnd = resolveEnd(nextStart, periodCount, selectedPlan);
    if (nextEnd) setPeriodEnd(nextEnd);
  };

  const handleCountChange = (nextCount: string) => {
    setPeriodCount(nextCount);
    const nextEnd = resolveEnd(periodStart, nextCount, selectedPlan);
    if (nextEnd) setPeriodEnd(nextEnd);
  };

  // A hand-picked end date wins, but the count is pulled back into line with it
  // so the two fields never contradict each other.
  const handleEndChange = (nextEnd: Date | null) => {
    setPeriodEnd(nextEnd);
    if (!nextEnd || !periodStart || !selectedPlan) return;
    const periods = countPlanPeriods(
      periodStart,
      nextEnd,
      selectedPlan.duration,
      selectedPlan.customDurationDays
    );
    if (periods) setPeriodCount(String(periods));
  };

  const planChanged = planId !== subscription.planId;

  // Priced over the whole span, the same total the server checks against.
  const periods = Number(periodCount);
  const amountDue =
    selectedPlan && Number.isInteger(periods) && periods > 0 ? selectedPlan.price * periods : null;
  const collectedAmount = Number(paymentAmount);
  const isAmountValid = paymentAmount !== '' && !Number.isNaN(collectedAmount) && collectedAmount >= 0;
  // Below the plan's price, the shortfall has to be accounted for — the server
  // rejects one no live campaign explains.
  const isDiscounted = isRecordingPayment && isAmountValid && amountDue !== null && collectedAmount < amountDue;
  const startChanged =
    (periodStart?.toISOString() ?? null) !==
    (toDate(subscription.currentPeriodStart)?.toISOString() ?? null);
  const periodChanged =
    (periodEnd?.toISOString() ?? null) !==
    (toDate(subscription.currentPeriodEnd)?.toISOString() ?? null);
  const trialChanged =
    (trialEndsAt?.toISOString() ?? null) !==
    (toDate(subscription.trialEndsAt)?.toISOString() ?? null);
  const dirty =
    planChanged || startChanged || periodChanged || trialChanged || isRecordingPayment;

  const periodInverted = Boolean(periodStart && periodEnd && periodEnd <= periodStart);
  const countLabel = selectedPlan ? formatPlanPeriodCountLabel(selectedPlan.duration) : 'Periods';
  const paymentIncomplete = isRecordingPayment && (!isAmountValid || (isDiscounted && !discountReason.trim()));

  const handleSave = () => {
    manageMutation.mutate(
      {
        id: subscription.id,
        ...(planChanged ? { planId } : {}),
        ...(startChanged
          ? { currentPeriodStart: periodStart ? toIsoDate(periodStart) : null }
          : {}),
        ...(periodChanged ? { currentPeriodEnd: periodEnd ? toIsoDate(periodEnd) : null } : {}),
        ...(trialChanged ? { trialEndsAt: trialEndsAt ? toIsoDate(trialEndsAt) : null } : {}),
        ...(isRecordingPayment && selectedPlan
          ? {
              periodCount: Number(periodCount),
              payment: {
                method: paymentMethod,
                amount: collectedAmount,
                currency: selectedPlan.currency ?? 'PKR',
                ...(paymentReference.trim() ? { reference: paymentReference.trim() } : {}),
                // Sent only when there is a gap to explain, so a full payment
                // never carries a stale reason from an abandoned edit.
                ...(isDiscounted && discountReason.trim()
                  ? { discountReason: discountReason.trim() }
                  : {}),
              },
            }
          : {}),
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={isOpen => !isOpen && onClose()}
      title="Manage subscription"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={manageMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!dirty || periodInverted || paymentIncomplete || manageMutation.isPending}
          >
            {manageMutation.isPending && <LuLoaderCircle className="size-4 animate-spin me-1" />}
            Save changes
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-default-500">
        {subscription.owner?.email ?? 'Account'} · currently on{' '}
        {subscription.plan?.name ?? 'unknown plan'}
      </p>

      <div className="space-y-4">
        <Field label="Plan" hint="Moving to another plan changes the account's limits immediately.">
          <Select
            value={planId}
            onChange={event => handlePlanChange(event.target.value)}
            disabled={plansQuery.isLoading}
          >
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name} — {formatPlanPrice(plan.price, plan.currency)}/
                {formatPlanPeriod(plan.duration, plan.customDurationDays)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Period starts" hint="The day this billing period began.">
          <DatePicker value={periodStart} onChange={handleStartChange} placeholder="No start date" />
        </Field>

        <Field
          label={`${countLabel} purchased`}
          hint={
            selectedPlan
              ? `How many ${formatPlanPeriod(
                  selectedPlan.duration,
                  selectedPlan.customDurationDays
                )} periods were paid for. Sets the end date automatically.`
              : 'How many plan periods were paid for.'
          }
        >
          <Input
            type="number"
            min={1}
            step={1}
            value={periodCount}
            onChange={event => handleCountChange(event.target.value)}
            disabled={!periodStart || !selectedPlan}
          />
        </Field>

        {isEndDateEditable ? (
          <Field
            label="Period ends"
            hint="Access stops after this date. Changing it re-derives the count above."
            error={periodInverted ? 'The end date must fall after the start date.' : undefined}
          >
            <DatePicker
              value={periodEnd}
              onChange={handleEndChange}
              placeholder="No end date"
              invalid={periodInverted}
            />
          </Field>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-md border border-default-200 px-3 py-2">
            <div>
              <p className="text-xs text-default-400">Period ends</p>
              <p className="text-sm font-medium text-default-700">
                {periodEnd ? formatDate(periodEnd.toISOString()) : 'No end date'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEndDateEditable(true)}>
              Update end period
            </Button>
          </div>
        )}

        <Field label="Trial ends" hint="Only meaningful while the subscription is TRIALING.">
          <DatePicker value={trialEndsAt} onChange={setTrialEndsAt} placeholder="Not a trial" />
        </Field>

        <div className="border-t border-default-200 pt-4">
          <ToggleRow
            label="Record a payment for this change"
            description="Money collected outside the checkout flow — a transfer taken by hand, say."
            checked={isRecordingPayment}
            onChange={event => setIsRecordingPayment(event.target.checked)}
          />

          {isRecordingPayment && (
            <div className="mt-3 space-y-2.5">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <Select
                  aria-label="Payment method"
                  value={paymentMethod}
                  onChange={event =>
                    setPaymentMethod(event.target.value as (typeof PAYMENT_METHODS)[number])
                  }
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method]}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  min={0}
                  aria-label="Amount collected"
                  placeholder="Amount"
                  value={paymentAmount}
                  invalid={!isAmountValid}
                  onChange={event => setPaymentAmount(event.target.value)}
                />
              </div>

              <Input
                placeholder="Transaction reference (optional)"
                value={paymentReference}
                onChange={event => setPaymentReference(event.target.value)}
              />

              {isDiscounted && selectedPlan && amountDue !== null && (
                <div className="rounded-lg border border-info/30 bg-info/5 p-3">
                  <p className="text-xs text-default-600">
                    {formatPlanPrice(amountDue - collectedAmount, selectedPlan.currency)} below the{' '}
                    {selectedPlan.name} price of{' '}
                    {formatPlanPrice(amountDue, selectedPlan.currency)}.
                  </p>
                  <Input
                    className="mt-2"
                    placeholder="Why? e.g. Eid campaign, loyalty discount"
                    aria-label="Reason for the reduced price"
                    value={discountReason}
                    onChange={event => setDiscountReason(event.target.value)}
                  />
                </div>
              )}

              <p className="text-xs text-default-400">
                {amountDue !== null && selectedPlan
                  ? `${countLabel} above are priced at ${formatPlanPrice(
                      amountDue,
                      selectedPlan.currency
                    )} in total. Recorded as paid today; the dates stay as set above.`
                  : 'Recorded as paid today. The dates stay as set above.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
