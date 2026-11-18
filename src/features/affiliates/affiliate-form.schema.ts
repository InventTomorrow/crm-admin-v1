import { z } from 'zod';
import type { AffiliateInput, AffiliateInviteInput, ReferralCodeInput } from './affiliates.api';
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

export const JOIN_OPTIONS = ['SET_PASSWORD', 'SIGNUP', 'EXISTING_ACCOUNT', 'LATER'] as const;
export type JoinOption = (typeof JOIN_OPTIONS)[number];

// Same shape as ReferralCodeInput; the values were already validated by the code dialog.
const referralCodeDraftSchema = z.object({
  code: z.string().optional(),
  discountPercent: z.number(),
  maxRedemptions: z.number().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const joinChoiceSchema = z.object({ joinOption: z.enum(JOIN_OPTIONS), userId: z.string() });

/** Mirrors the server's createAffiliateSchema (admin/affiliates/affiliates.dto.ts). */
export const affiliateFormSchema = z
  .object({
    userId: z.string(),
    name: z.string().trim().min(2, 'At least 2 characters').max(120),
    email: z.email('Enter a valid email').max(160),
    phone: z.string().trim().max(30),
    commissionPercent: z
      .number({ message: 'Required' })
      .min(0, 'Cannot be negative')
      .max(MAX_COMMISSION_PERCENT, `At most ${MAX_COMMISSION_PERCENT}%`),
    selfServeMaxDiscountPercent: z
      .number()
      .int()
      .min(MIN_REFERRAL_DISCOUNT_PERCENT)
      .max(MAX_REFERRAL_DISCOUNT_PERCENT)
      .nullable(),
    status: z.enum(['ACTIVE', 'PAUSED']),
    notes: z.string().trim().max(1000),
    // Create only: codes to add right after the affiliate exists, each built in the code dialog.
    referralCodes: z.array(referralCodeDraftSchema),
    // Create only: how the affiliate gets an account to sign in with.
    joinOption: z.enum(JOIN_OPTIONS),
    sendInviteEmail: z.boolean(),
  })
  .refine(values => values.joinOption !== 'EXISTING_ACCOUNT' || values.userId !== '', {
    message: 'Pick the account to link',
    path: ['userId'],
    // Runs even while later steps are still empty, so the sign-in step can report it.
    when: payload => joinChoiceSchema.safeParse(payload.value).success,
  });

export type AffiliateFormValues = z.infer<typeof affiliateFormSchema>;

export function affiliateFormDefaults(affiliate?: Affiliate | null): AffiliateFormValues {
  return {
    userId: affiliate?.userId ?? '',
    name: affiliate?.name ?? '',
    email: affiliate?.email ?? '',
    phone: affiliate?.phone ?? '',
    commissionPercent: affiliate?.commissionPercent ?? 10,
    selfServeMaxDiscountPercent: affiliate?.selfServeMaxDiscountPercent ?? null,
    status: affiliate?.status ?? 'ACTIVE',
    notes: affiliate?.notes ?? '',
    referralCodes: [],
    joinOption: 'SET_PASSWORD',
    sendInviteEmail: true,
  };
}

export function toAffiliateInput(values: AffiliateFormValues, isEditing: boolean): AffiliateInput {
  const linksAccount = isEditing || values.joinOption === 'EXISTING_ACCOUNT';
  return {
    userId: linksAccount ? values.userId || null : null,
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || null,
    commissionPercent: values.commissionPercent,
    selfServeMaxDiscountPercent: values.selfServeMaxDiscountPercent,
    status: values.status,
    notes: values.notes.trim() || null,
  };
}

export function toInviteInput(values: AffiliateFormValues): AffiliateInviteInput | null {
  if (values.joinOption !== 'SET_PASSWORD' && values.joinOption !== 'SIGNUP') return null;
  return { method: values.joinOption, sendEmail: values.sendInviteEmail };
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

/** Dialog values for a saved code, a draft code, or a blank new one. */
export function referralCodeFormValues(
  referralCode?: (Omit<ReferralCodeInput, 'code'> & { code?: string }) | null
): ReferralCodeFormValues {
  return {
    code: referralCode?.code ?? '',
    discountPercent: referralCode?.discountPercent ?? 10,
    maxRedemptions: referralCode?.maxRedemptions ?? null,
    expiresAt: referralCode?.expiresAt ? new Date(referralCode.expiresAt) : null,
    isActive: referralCode?.isActive ?? true,
  };
}

export function toReferralCodeInput(values: ReferralCodeFormValues): ReferralCodeInput {
  return {
    discountPercent: values.discountPercent,
    maxRedemptions: values.maxRedemptions,
    expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null,
    isActive: values.isActive,
    ...(values.code ? { code: values.code.toUpperCase() } : {}),
  };
}

/** Mirrors the server's approveAffiliateApplicationSchema. */
export const approveApplicationFormSchema = z.object({
  commissionPercent: z
    .number({ message: 'Required' })
    .min(0, 'Cannot be negative')
    .max(MAX_COMMISSION_PERCENT, `At most ${MAX_COMMISSION_PERCENT}%`),
  method: z.enum(['SET_PASSWORD', 'SIGNUP']),
  sendEmail: z.boolean(),
});

export type ApproveApplicationFormValues = z.infer<typeof approveApplicationFormSchema>;
