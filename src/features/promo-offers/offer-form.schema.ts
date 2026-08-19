import { z } from 'zod';
import {
  MAX_DISCOUNT_PERCENT,
  MAX_OFFER_DURATION_DAYS,
  MIN_DISCOUNT_PERCENT,
  MIN_OFFER_DURATION_DAYS,
} from './types';
import type { CreatePromoOfferInput } from './types';

/** Mirrors the server's createPromoOfferSchema (admin/promo-offers/promo-offers.dto.ts). */
export const offerFormSchema = z.object({
  title: z.string().trim().min(1, 'Required').max(80, 'Keep it under 80 characters'),
  description: z.string().trim().max(240, 'Keep it under 240 characters'),
  discountPercent: z
    .number({ message: 'Required' })
    .int('Whole numbers only')
    .min(MIN_DISCOUNT_PERCENT, `At least ${MIN_DISCOUNT_PERCENT}%`)
    .max(MAX_DISCOUNT_PERCENT, `At most ${MAX_DISCOUNT_PERCENT}%`),
  durationDays: z
    .number({ message: 'Required' })
    .int()
    .min(MIN_OFFER_DURATION_DAYS)
    .max(MAX_OFFER_DURATION_DAYS),
});

export type OfferFormValues = z.infer<typeof offerFormSchema>;

export const OFFER_FORM_DEFAULTS: OfferFormValues = {
  title: '',
  description: '',
  discountPercent: 20,
  durationDays: 7,
};

/** Every duration an admin can pick, as the brief specifies: 3 to 30 days. */
export const DURATION_DAY_OPTIONS = Array.from(
  { length: MAX_OFFER_DURATION_DAYS - MIN_OFFER_DURATION_DAYS + 1 },
  (_, index) => MIN_OFFER_DURATION_DAYS + index
);

export function toCreateOfferInput(values: OfferFormValues): CreatePromoOfferInput {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    discountPercent: values.discountPercent,
    durationDays: values.durationDays,
  };
}
