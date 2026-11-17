import { z } from 'zod';
import {
  MAX_COMMISSION_PERCENT,
  MAX_REFERRAL_DISCOUNT_PERCENT,
  MIN_REFERRAL_DISCOUNT_PERCENT,
  type Affiliate,
} from './types';

const CODE_PATTERN = /^[A-Za-z0-9]{3,20}$/;
const CODE_PATTERN_MESSAGE = 'Use 3 to 20 letters or numbers, no spaces';

const optionalCodeField = z
  .string()
  .trim()
  .refine(code => code === '' || CODE_PATTERN.test(code), CODE_PATTERN_MESSAGE);

const discountPercentField = z
  .number({ message: 'Required' })
  .int('Whole numbers only')
  .min(MIN_REFERRAL_DISCOUNT_PERCENT, `At least ${MIN_REFERRAL_DISCOUNT_PERCENT}%`)
  .max(MAX_REFERRAL_DISCOUNT_PERCENT, `At most ${MAX_REFERRAL_DISCOUNT_PERCENT}%`);

/** Mirrors the server's createAffiliateSchema (admin/affiliates/affiliates.dto.ts). */
export const affiliateFormSchema = z.object({
  userId: z.string(),
  name: z.string().trim().min(2, 'At least 2 characters').max(120),
  email: z.email('Enter a valid email').max(160),
  phone: z.string().trim().max(30),
  commissionPercent: z
    .number({ message: 'Required' })
    .min(0, 'Cannot be negative')
    .max(MAX_COMMISSION_PERCENT, `At most ${MAX_COMMISSION_PERCENT}%`),
  status: z.enum(['ACTIVE', 'PAUSED']),
  notes: z.string().trim().max(1000),
  createFirstCode: z.boolean(),
  firstCode: optionalCodeField,
  firstCodeDiscountPercent: discountPercentField,
});

export type AffiliateFormValues = z.infer<typeof affiliateFormSchema>;

export function affiliateFormDefaults(affiliate?: Affiliate | null): AffiliateFormValues {
  return {
    userId: affiliate?.userId ?? '',
    name: affiliate?.name ?? '',
    email: affiliate?.email ?? '',
    phone: affiliate?.phone ?? '',
    commissionPercent: affiliate?.commissionPercent ?? 10,
    status: affiliate?.status ?? 'ACTIVE',
    notes: affiliate?.notes ?? '',
    createFirstCode: !affiliate,
    firstCode: '',
    firstCodeDiscountPercent: 10,
  };
}

/** Mirrors the server's create/updateReferralCodeSchema. */
export const referralCodeFormSchema = z.object({
  code: optionalCodeField,
  discountPercent: discountPercentField,
  maxRedemptions: z.number().int('Whole numbers only').min(1, 'At least 1').nullable(),
  expiresAt: z
    .date()
    .refine(date => date.getTime() > Date.now(), 'Pick a date in the future')
    .nullable(),
  isActive: z.boolean(),
});

export type ReferralCodeFormValues = z.infer<typeof referralCodeFormSchema>;
