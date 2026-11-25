import { LuHourglass } from 'react-icons/lu';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { usePermissions } from '@/features/auth/auth.hooks';
import { formatDate } from '@/lib/format';
import { SystemPermissions } from '@/lib/permissions';
import { formatPlanPrice } from '@/lib/planFormat';
import type { PendingPaymentItem } from '@/lib/types';

interface PendingPaymentsListProps {
  pendingPayments: PendingPaymentItem[];
  /** Pre-fills the User payments search so the reviewer lands on this account's rows. */
  accountEmail: string;
}

/** Customer-submitted payments that become invoices once an admin approves them. */
export function PendingPaymentsList({ pendingPayments, accountEmail }: PendingPaymentsListProps) {
  const { can } = usePermissions();
  if (pendingPayments.length === 0) return null;

  const reviewHref = `/subscription-requests?q=${encodeURIComponent(accountEmail)}`;

  return (
    <ul className="divide-y divide-warning/20 overflow-hidden rounded-lg border border-warning/30 bg-warning/5">
      {pendingPayments.map(pendingPayment => (
        <li key={pendingPayment.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-warning/15 text-warning">
            <LuHourglass className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-default-800">
              {pendingPayment.planName ?? 'Plan'}
              {pendingPayment.periodCount > 1 ? ` × ${pendingPayment.periodCount}` : ''}
            </p>
            <p className="truncate text-xs text-default-500">
              {pendingPayment.methodLabel}
              {pendingPayment.reference ? ` · ${pendingPayment.reference}` : ''} · submitted{' '}
              {formatDate(pendingPayment.submittedAt)}
            </p>
          </div>
          <span className="text-sm font-semibold tabular-nums text-default-800">
            {formatPlanPrice(pendingPayment.amount, pendingPayment.currency)}
          </span>
          <Badge tone="warning">Pending approval</Badge>
          {can(SystemPermissions.SUBSCRIPTION_REQUESTS_VIEW) && (
            <Link to={reviewHref} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Review
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
