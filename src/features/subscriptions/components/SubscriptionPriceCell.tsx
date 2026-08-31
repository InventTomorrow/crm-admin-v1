import { Badge } from '@/components/ui/badge';
import { formatPlanPrice } from '@/lib/planFormat';
import type { SubscriptionBilling } from '@/lib/types';
import { LuTicketPercent } from 'react-icons/lu';

/**
 * The plan's list price. Struck through once the account paid less than it, so
 * the two price columns read as "was / became" rather than as two unrelated
 * numbers that happen to disagree.
 */
export function SubscriptionPlanPriceCell({ billing }: { billing: SubscriptionBilling }) {
  const isDiscounted = billing.discount !== null;
  return (
    <span
      className={
        isDiscounted
          ? 'tabular-nums text-default-400 line-through decoration-default-400'
          : 'tabular-nums text-default-700'
      }
      title={isDiscounted ? 'List price of the plan when it was bought' : undefined}
    >
      {formatPlanPrice(billing.planPrice, billing.currency)}
    </span>
  );
}

/**
 * What actually came in, with the shortfall and its reason underneath. An
 * unexplained discount says so out loud instead of quietly reading as a smaller
 * number — that gap is the thing an admin needs to notice.
 */
export function SubscriptionPriceCell({ billing }: { billing: SubscriptionBilling }) {
  if (billing.paidAmount === null) {
    return <span className="text-default-400">No payment recorded</span>;
  }

  return (
    <div className="min-w-0 space-y-1">
      <div className="font-medium tabular-nums text-default-800">
        {formatPlanPrice(billing.paidAmount, billing.currency)}
      </div>
      {billing.discount && (
        <Badge
          tone={billing.discount.reason ? 'info' : 'warning'}
          icon={LuTicketPercent}
          className="max-w-full"
        >
          <span className="truncate">
            −{billing.discount.percent}% · {billing.discount.reason ?? 'Reason not recorded'}
          </span>
        </Badge>
      )}
    </div>
  );
}
