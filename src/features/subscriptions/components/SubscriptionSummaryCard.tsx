import { useState } from 'react';
import {
  LuCalendarOff,
  LuCreditCard,
  LuEllipsisVertical,
  LuFilePlus,
  LuSettings2,
  LuTrash2,
  LuWallet,
} from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { Select } from '@/components/ui/select';
import { usePermissions } from '@/features/auth/auth.hooks';
import { formatDate } from '@/lib/format';
import { SystemPermissions } from '@/lib/permissions';
import { SUBSCRIPTION_STATUS_TONE } from '@/lib/statusTones';
import type { SubscriptionListItem, SubscriptionStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  useCancelSubscriptionAtPeriodEnd,
  useDeleteSubscription,
  useSubscriptions,
  useUpdateSubscriptionStatus,
} from '../subscriptions.hooks';
import { getBillingPeriodProgress } from '../billing-period';
import { ManageSubscriptionDialog } from './ManageSubscriptionDialog';
import { SubscriptionPlanPriceCell, SubscriptionPriceCell } from './SubscriptionPriceCell';

const SURFACE_CLASS = 'rounded-xl border border-default-200 bg-card p-4 dark:bg-default-100';

function BillingPeriodProgress({ subscription }: { subscription: SubscriptionListItem }) {
  const progress = getBillingPeriodProgress(
    subscription.currentPeriodStart,
    subscription.currentPeriodEnd
  );
  if (!progress) {
    return <p className="text-xs text-default-400">No billing period set</p>;
  }

  const barTone =
    progress.daysLeft < 0 ? 'bg-danger' : progress.daysLeft <= 7 ? 'bg-warning' : 'bg-primary';
  const remainingLabel =
    progress.daysLeft < 0
      ? `Ended ${Math.abs(progress.daysLeft)} day${progress.daysLeft === -1 ? '' : 's'} ago`
      : progress.daysLeft === 0
        ? 'Ends today'
        : `${progress.daysLeft} day${progress.daysLeft === 1 ? '' : 's'} left`;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="text-default-500">
          {formatDate(subscription.currentPeriodStart)} to{' '}
          {formatDate(subscription.currentPeriodEnd)}
        </span>
        <span className="font-medium text-default-700">{remainingLabel}</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-default-200"
        role="progressbar"
        aria-valuenow={progress.elapsedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Billing period used"
      >
        <div
          className={cn('h-full rounded-full transition-all', barTone)}
          style={{ width: `${progress.elapsedPercent}%` }}
        />
      </div>
    </div>
  );
}

function SubscriptionCardSkeleton() {
  return (
    <div className={cn(SURFACE_CLASS, 'space-y-3')}>
      <div className="h-3 w-24 animate-pulse rounded bg-default-200" />
      <div className="h-5 w-40 animate-pulse rounded bg-default-200" />
      <div className="h-1.5 w-full animate-pulse rounded bg-default-150" />
      <div className="h-8 w-full animate-pulse rounded bg-default-150" />
    </div>
  );
}

const NO_OPEN_INVOICE_HINT = 'No unpaid invoices. Create an invoice first.';

interface SubscriptionSummaryCardProps {
  ownerUserId: string;
  onCreateInvoice?: () => void;
  onMakePayment?: () => void;
  /** A payment always settles an invoice, so Make payment is disabled at 0. */
  openInvoiceCount?: number;
}

/** The account's current (or latest) subscription with the actions that manage it. */
export function SubscriptionSummaryCard({
  ownerUserId,
  onCreateInvoice,
  onMakePayment,
  openInvoiceCount,
}: SubscriptionSummaryCardProps) {
  const { can } = usePermissions();
  const canEditSubscription = can(SystemPermissions.SUBSCRIPTIONS_EDIT);
  const canCancelSubscription = can(SystemPermissions.SUBSCRIPTIONS_CANCEL);
  const canDeleteSubscription = can(SystemPermissions.SUBSCRIPTIONS_DELETE);
  const [isManaging, setIsManaging] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Paid live subscriptions sort first, so the first row is the one that grants access.
  const subscriptionsQuery = useSubscriptions({ page: 1, limit: 1, ownerUserId });
  const statusMutation = useUpdateSubscriptionStatus();
  const cancelMutation = useCancelSubscriptionAtPeriodEnd();
  const deleteMutation = useDeleteSubscription();

  if (subscriptionsQuery.isLoading) return <SubscriptionCardSkeleton />;

  if (subscriptionsQuery.isError) {
    return (
      <div className={cn(SURFACE_CLASS, 'text-sm text-default-500')}>
        Could not load the subscription.{' '}
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => subscriptionsQuery.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  const subscription = subscriptionsQuery.data?.items[0] ?? null;
  const isPaymentBlocked = openInvoiceCount === 0;

  if (!subscription) {
    return (
      <div className={cn(SURFACE_CLASS, 'flex flex-col items-center py-8 text-center')}>
        <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-default-100 text-default-400">
          <LuCreditCard className="size-5" />
        </span>
        <p className="text-sm font-medium text-default-800">No plan yet</p>
        <p className="mt-1 text-xs text-default-500">
          Create an invoice, then make a payment to activate a plan.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {onCreateInvoice && (
            <Button size="sm" onClick={onCreateInvoice}>
              <LuFilePlus className="size-4 me-1" /> Create invoice
            </Button>
          )}
          {onMakePayment && (
            <Button
              size="sm"
              variant="outline"
              onClick={onMakePayment}
              disabled={isPaymentBlocked}
              title={isPaymentBlocked ? NO_OPEN_INVOICE_HINT : undefined}
            >
              <LuWallet className="size-4 me-1" /> Make payment
            </Button>
          )}
        </div>
      </div>
    );
  }

  const isLive = subscription.status === 'ACTIVE' || subscription.status === 'TRIALING';

  return (
    <div className={cn(SURFACE_CLASS, 'flex flex-col gap-4')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-default-400">
            {isLive ? 'Current plan' : 'Latest plan'}
          </p>
          <p className="mt-1 truncate text-lg font-semibold text-default-900">
            {subscription.plan?.name ?? 'N/A'}
          </p>
        </div>
        <Badge tone={SUBSCRIPTION_STATUS_TONE[subscription.status]}>{subscription.status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg bg-default-50 p-3 dark:bg-default-150/40">
        <div>
          <p className="text-xs text-default-500">Plan price</p>
          <div className="mt-0.5 text-sm">
            <SubscriptionPlanPriceCell billing={subscription.billing} />
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-default-500">Last paid</p>
          <div className="mt-0.5 text-sm">
            <SubscriptionPriceCell billing={subscription.billing} />
          </div>
        </div>
      </div>

      <BillingPeriodProgress subscription={subscription} />

      {(canEditSubscription ||
        canCancelSubscription ||
        canDeleteSubscription ||
        onMakePayment ||
        onCreateInvoice) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-default-200 pt-3">
          {canEditSubscription && (
            <Select
              value={subscription.status}
              onChange={event =>
                statusMutation.mutate({
                  id: subscription.id,
                  status: event.target.value as SubscriptionStatus,
                })
              }
              className="form-input-sm w-32"
              aria-label="Change subscription status"
            >
              <option value="TRIALING">Trialing</option>
              <option value="ACTIVE">Active</option>
              <option value="PAST_DUE">Past due</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          )}
          {canEditSubscription && (
            <Button variant="outline" size="sm" onClick={() => setIsManaging(true)}>
              <LuSettings2 className="size-4 me-1" /> Change plan / dates
            </Button>
          )}
          {onCreateInvoice && (
            <Button variant="outline" size="sm" onClick={onCreateInvoice}>
              <LuFilePlus className="size-4 me-1" /> Create invoice
            </Button>
          )}
          {onMakePayment && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMakePayment}
              disabled={isPaymentBlocked}
              title={isPaymentBlocked ? NO_OPEN_INVOICE_HINT : undefined}
            >
              <LuWallet className="size-4 me-1" /> Make payment
            </Button>
          )}
          {(canCancelSubscription || canDeleteSubscription) && (
            <span className="ms-auto">
              <Dropdown
                trigger={<LuEllipsisVertical className="size-4" />}
                triggerLabel="More subscription actions"
              >
                {canCancelSubscription && (
                  <DropdownItem
                    icon={LuCalendarOff}
                    // Only a live subscription has a period left to run out.
                    disabled={!isLive || !subscription.currentPeriodEnd}
                    onSelect={() => cancelMutation.mutate(subscription.id)}
                  >
                    Cancel at period end
                  </DropdownItem>
                )}
                {canDeleteSubscription && (
                  <DropdownItem
                    icon={LuTrash2}
                    destructive
                    onSelect={() => setIsConfirmingDelete(true)}
                  >
                    Delete subscription
                  </DropdownItem>
                )}
              </Dropdown>
            </span>
          )}
        </div>
      )}

      <ManageSubscriptionDialog
        subscription={isManaging ? subscription : null}
        open={isManaging}
        onClose={() => setIsManaging(false)}
      />

      <ConfirmDialog
        open={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        title="Delete this subscription?"
        description={`${subscription.owner?.email ?? 'This account'} loses access to every workspace immediately, and their WhatsApp bot stops replying. Invoices and payments are kept. This cannot be undone.`}
        confirmLabel="Delete subscription"
        isLoading={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(subscription.id, {
            onSuccess: () => setIsConfirmingDelete(false),
          })
        }
      />
    </div>
  );
}
