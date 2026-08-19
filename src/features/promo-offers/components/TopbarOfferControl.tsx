import { useState } from 'react';
import { LuBadgePercent } from 'react-icons/lu';
import { useActivePromoOffer } from '../offers.hooks';
import { CreateOfferDialog } from './CreateOfferDialog';
import { OfferCountdown } from './OfferCountdown';

/**
 * Topbar entry point for campaigns: a live countdown pill while one runs, and
 * the button that starts a new one. Sits in the chrome so the running discount
 * is visible from every admin page, not just the plans screen.
 */
export function TopbarOfferControl() {
  const { data: offer } = useActivePromoOffer();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      {offer && (
        <div className="hidden items-center gap-2 rounded-full bg-warning/15 py-1 ps-3 pe-3.5 text-warning sm:flex">
          <LuBadgePercent className="size-4 shrink-0" />
          <span className="text-sm font-semibold">{offer.discountPercent}% OFF</span>
          <span className="text-warning/40">|</span>
          <OfferCountdown endsAt={offer.endsAt} />
        </div>
      )}

      <button
        type="button"
        aria-label={offer ? 'Replace the running offer' : 'Start an offer'}
        title={offer ? 'Replace the running offer' : 'Start an offer'}
        onClick={() => setIsDialogOpen(true)}
        className="btn btn-icon size-8 rounded-full hover:bg-default-150"
      >
        <LuBadgePercent className="size-4.5" />
      </button>

      <CreateOfferDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
