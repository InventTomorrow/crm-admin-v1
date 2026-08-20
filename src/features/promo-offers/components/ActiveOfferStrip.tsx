import { useState } from 'react';
import { LuBadgePercent, LuCircleStop } from 'react-icons/lu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatOfferEndDate } from '../offer-schedule';
import { useActivePromoOffer, useEndPromoOffer } from '../offers.hooks';
import { OfferCountdown } from './OfferCountdown';

/**
 * Full-width reminder that every published plan is currently discounted. It is
 * deliberately not dismissible — an admin approving a payment needs to know
 * why the amount is lower than the plan's list price.
 */
export function ActiveOfferStrip() {
  const { data: offer } = useActivePromoOffer();
  const endOffer = useEndPromoOffer();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (!offer) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-warning/20 bg-warning/10 px-6 py-2 text-sm text-default-700">
        <LuBadgePercent className="size-4 shrink-0 text-warning" />
        <span>
          <strong className="font-semibold">{offer.title}</strong> — every plan is{' '}
          <strong className="font-semibold">{offer.discountPercent}% off</strong> until
          midnight on {formatOfferEndDate(offer.endsAt)}
        </span>
        <OfferCountdown endsAt={offer.endsAt} className="text-warning" />
        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          className="ms-auto inline-flex items-center gap-1.5 text-sm font-medium text-default-500 hover:text-danger"
        >
          <LuCircleStop className="size-4" />
          End now
        </button>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="End this offer?"
        description="Plans go back to their list price immediately and the countdown disappears for every customer. Payments already in flight keep the discounted price for a few hours."
        intent="warning"
        confirmLabel="End offer"
        isLoading={endOffer.isPending}
        onConfirm={() =>
          endOffer.mutate(offer.id, { onSuccess: () => setIsConfirmOpen(false) })
        }
      />
    </>
  );
}
