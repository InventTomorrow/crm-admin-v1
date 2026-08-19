/** Campaign bounds — mirrors server/src/modules/promo-offers/promo-offer.util.ts. */
export const MIN_OFFER_DURATION_DAYS = 3;
export const MAX_OFFER_DURATION_DAYS = 30;
export const MIN_DISCOUNT_PERCENT = 1;
export const MAX_DISCOUNT_PERCENT = 90;

/** The live campaign, as the public and admin "active" endpoints return it. */
export interface ActiveOffer {
  id: string;
  title: string;
  description: string | null;
  discountPercent: number;
  durationDays: number;
  startsAt: string;
  endsAt: string;
}

/** A row from the campaign history — includes the admin who started it. */
export interface PromoOffer extends ActiveOffer {
  isActive: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

/** Mirrors the server's createPromoOfferSchema. */
export interface CreatePromoOfferInput {
  title: string;
  description: string | null;
  discountPercent: number;
  durationDays: number;
}
