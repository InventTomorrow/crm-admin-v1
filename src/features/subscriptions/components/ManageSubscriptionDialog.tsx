import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Field } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { listPlans } from '@/features/plans/plans.api';
import { formatPlanPeriod, formatPlanPrice } from '@/lib/planFormat';
import type { Subscription } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
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
 * Extending `currentPeriodEnd` is how a manual-mode customer gets renewed —
 * there is no gateway to do it automatically.
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
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);

  const plansQuery = useQuery({ queryKey: ['plans'], queryFn: listPlans, enabled: open });
  const plans = plansQuery.data ?? [];

  // Re-seed whenever a different row opens the dialog.
  useEffect(() => {
    if (!open || !subscription) return;
    setPlanId(subscription.planId);
    setPeriodEnd(toDate(subscription.currentPeriodEnd));
    setTrialEndsAt(toDate(subscription.trialEndsAt));
  }, [open, subscription]);

  if (!subscription) return null;

  const planChanged = planId !== subscription.planId;
  const periodChanged =
    (periodEnd?.toISOString() ?? null) !==
    (toDate(subscription.currentPeriodEnd)?.toISOString() ?? null);
  const trialChanged =
    (trialEndsAt?.toISOString() ?? null) !==
    (toDate(subscription.trialEndsAt)?.toISOString() ?? null);
  const dirty = planChanged || periodChanged || trialChanged;

  const handleSave = () => {
    manageMutation.mutate(
      {
        id: subscription.id,
        ...(planChanged ? { planId } : {}),
        ...(periodChanged ? { currentPeriodEnd: periodEnd ? toIsoDate(periodEnd) : null } : {}),
        ...(trialChanged ? { trialEndsAt: trialEndsAt ? toIsoDate(trialEndsAt) : null } : {}),
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
          <Button onClick={handleSave} disabled={!dirty || manageMutation.isPending}>
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
            onChange={event => setPlanId(event.target.value)}
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

        <Field
          label="Period ends"
          hint="Access stops after this date. Push it forward to renew a manual subscription."
        >
          <DatePicker value={periodEnd} onChange={setPeriodEnd} placeholder="No end date" />
        </Field>

        <Field label="Trial ends" hint="Only meaningful while the subscription is TRIALING.">
          <DatePicker value={trialEndsAt} onChange={setTrialEndsAt} placeholder="Not a trial" />
        </Field>
      </div>
    </Modal>
  );
}
