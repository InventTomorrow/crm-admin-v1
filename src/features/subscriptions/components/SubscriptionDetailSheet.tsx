import type { ReactNode } from 'react';
import {
  LuCalendarClock,
  LuCalendarPlus,
  LuCalendarX,
  LuCreditCard,
  LuHourglass,
  LuReceipt,
  LuUser,
} from 'react-icons/lu';
import { Sheet } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, formatFullName, formatRelative } from '@/lib/format';
import { SUBSCRIPTION_STATUS_TONE } from '@/lib/statusTones';
import type { SubscriptionListItem } from '@/lib/types';
import { SubscriptionPlanPriceCell, SubscriptionPriceCell } from './SubscriptionPriceCell';

function DetailRow({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-default-100 text-default-500">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-default-500">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-default-800">{value}</div>
        {sub && <p className="mt-0.5 text-xs text-default-400">{sub}</p>}
      </div>
    </div>
  );
}

interface SubscriptionDetailSheetProps {
  subscription: SubscriptionListItem | null;
  open: boolean;
  onClose: () => void;
}

/** Slide-over with the full subscription record, timestamps included. */
export function SubscriptionDetailSheet({
  subscription,
  open,
  onClose,
}: SubscriptionDetailSheetProps) {
  const ownerName = subscription
    ? formatFullName(subscription.owner?.firstName ?? null, subscription.owner?.lastName ?? null)
    : '—';

  return (
    <Sheet
      open={open}
      onOpenChange={isOpen => !isOpen && onClose()}
      title="Subscription details"
      description={subscription?.plan?.name}
    >
      {subscription && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-default-200 bg-default-50 px-4 py-3">
            <span className="text-sm text-default-600">Current status</span>
            <Badge tone={SUBSCRIPTION_STATUS_TONE[subscription.status]}>
              {subscription.status}
            </Badge>
          </div>

          <div className="divide-y divide-default-200">
            <DetailRow
              icon={<LuUser className="size-4.5" />}
              label="Account owner"
              value={ownerName === '—' ? (subscription.owner?.email ?? '—') : ownerName}
              sub={subscription.owner?.email}
            />
            <DetailRow
              icon={<LuCreditCard className="size-4.5" />}
              label="Plan"
              value={subscription.plan?.name ?? '—'}
              sub={subscription.plan?.tier}
            />
            <DetailRow
              icon={<LuReceipt className="size-4.5" />}
              label="Plan price vs paid"
              value={
                <span className="flex flex-wrap items-center gap-2">
                  <SubscriptionPlanPriceCell billing={subscription.billing} />
                  <SubscriptionPriceCell billing={subscription.billing} />
                </span>
              }
              sub={
                subscription.billing.paidAt
                  ? `Paid ${formatDateTime(subscription.billing.paidAt)}`
                  : undefined
              }
            />
            <DetailRow
              icon={<LuCalendarPlus className="size-4.5" />}
              label="Started"
              value={formatDateTime(subscription.createdAt)}
              sub={formatRelative(subscription.createdAt)}
            />
            <DetailRow
              icon={<LuHourglass className="size-4.5" />}
              label="Trial ends"
              value={formatDateTime(subscription.trialEndsAt)}
              sub={subscription.trialEndsAt ? formatRelative(subscription.trialEndsAt) : undefined}
            />
            <DetailRow
              icon={<LuCalendarClock className="size-4.5" />}
              label="Current period ends"
              value={formatDateTime(subscription.currentPeriodEnd)}
              sub={
                subscription.currentPeriodEnd
                  ? formatRelative(subscription.currentPeriodEnd)
                  : undefined
              }
            />
            <DetailRow
              icon={<LuCalendarX className="size-4.5" />}
              label="Cancelled"
              value={formatDateTime(subscription.cancelledAt)}
              sub={subscription.cancelledAt ? formatRelative(subscription.cancelledAt) : undefined}
            />
          </div>

          <p className="text-xs text-default-400">Subscription ID: {subscription.id}</p>
        </div>
      )}
    </Sheet>
  );
}
