import { LuBanknote } from 'react-icons/lu';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/features/subscriptions/subscriptions.api';
import { formatDate, formatMoneyPKR } from '@/lib/format';
import { useAffiliatePayouts } from '../affiliates.hooks';

const paymentMethodLabel = (method: string | null) =>
  method ? (PAYMENT_METHOD_LABELS[method as PaymentMethod] ?? method) : 'N/A';

export function PayoutsPanel({ affiliateId }: { affiliateId: string }) {
  const { data: payouts, isLoading, isError, error, refetch } = useAffiliatePayouts(affiliateId);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!payouts?.length) return <EmptyState message="No payouts recorded yet." />;

  return (
    <ol className="relative space-y-4 border-s border-default-200 ps-6">
      {payouts.map(payout => (
        <li key={payout.id} className="relative">
          <span className="absolute -start-[33px] flex size-5 items-center justify-center rounded-full bg-success text-white">
            <LuBanknote className="size-3" />
          </span>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-base font-semibold tabular-nums text-default-900">
              {formatMoneyPKR(payout.amount)}
            </p>
            <p className="text-xs text-default-500">{formatDate(payout.paidAt)}</p>
          </div>
          <p className="text-sm text-default-500">
            {paymentMethodLabel(payout.method)} · {payout._count.referrals} referral
            {payout._count.referrals === 1 ? '' : 's'}
            {payout.reference ? ` · Ref ${payout.reference}` : ''}
          </p>
          {payout.notes && <p className="mt-1 text-xs text-default-400">{payout.notes}</p>}
        </li>
      ))}
    </ol>
  );
}
