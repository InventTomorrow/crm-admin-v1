import { isUnlimitedLimit, UNLIMITED_LIMIT } from '@/lib/planFormat';
import type { Plan } from '@/lib/types';
import { z } from 'zod';
import type { PlanInput } from './plans.api';

export const UNIVERSAL = 'UNIVERSAL' as const;

/**
 * Every count an admin can cap. The number inputs themselves stay at min 0 —
 * only the Unlimited checkbox writes the sentinel.
 */
const limitInt = () => z.number().int().min(UNLIMITED_LIMIT, 'Cannot be negative');

/**
 * Mirrors the server's planInputSchema. `businessVertical` uses a sentinel
 * string because a select input cannot hold a null value; it's mapped back to
 * null on submit. `price` is the charged (discounted) price; `originalPrice`
 * is the struck-through "actual" price shown on the landing page.
 */
export const planFormSchema = z
  .object({
    name: z.string().min(1, 'Required'),
    tier: z.enum(['TRIAL', 'STARTER', 'GROWTH', 'AGENCY', 'RESELLER']),
    businessVertical: z.enum([
      UNIVERSAL,
      'ECOMMERCE',
      'RESTAURANT',
      'MARKETING_AGENCY',
      'HEALTHCARE',
    ]),
    tagline: z.string().max(200, 'Keep it under 200 characters'),

    price: z.number().min(0),
    originalPrice: z.number().min(0).nullable(),
    offerEndsAt: z.date().nullable(),
    wholesalePrice: z.number().min(0),
    currency: z.string().length(3, '3-letter code'),

    duration: z.enum([
      'DAYS_3',
      'DAYS_7',
      'DAYS_14',
      'MONTHLY',
      'QUARTERLY',
      'SEMI_ANNUAL',
      'ANNUAL',
      'CUSTOM_DAYS',
    ]),
    customDurationDays: z.number().int().min(1).max(365).nullable(),
    isTrial: z.boolean(),

    maxWorkspaces: limitInt(),
    maxMembersPerWorkspace: limitInt(),
    maxChannels: limitInt(),

    maxProducts: limitInt(),
    maxMenuItems: limitInt(),
    maxServices: limitInt(),
    maxClinicalServices: limitInt(),

    maxMonthlyMessages: limitInt(),
    maxImageMessages: limitInt(),
    maxVoiceMessages: limitInt(),

    features: z.array(z.object({ value: z.string().min(1, 'Required').max(160) })),
    ctaLabel: z.string().max(60, 'Keep it under 60 characters'),
    isFeatured: z.boolean(),
    isComingSoon: z.boolean(),

    isPublic: z.boolean(),
    isActive: z.boolean(),
  })
  // Same rules the server enforces — surfaced here so the user sees them on
  // the offending field instead of as a generic 400.
  .superRefine((v, ctx) => {
    // An unlimited monthly total leaves both carve-outs unconstrained; a
    // capped total cannot hold an uncapped one.
    if (!isUnlimitedLimit(v.maxMonthlyMessages)) {
      if (isUnlimitedLimit(v.maxImageMessages)) {
        ctx.addIssue({
          code: 'custom',
          path: ['maxImageMessages'],
          message: 'Only unlimited when total monthly messages is unlimited',
        });
      }
      if (isUnlimitedLimit(v.maxVoiceMessages)) {
        ctx.addIssue({
          code: 'custom',
          path: ['maxVoiceMessages'],
          message: 'Only unlimited when total monthly messages is unlimited',
        });
      }
      if (
        !isUnlimitedLimit(v.maxImageMessages) &&
        !isUnlimitedLimit(v.maxVoiceMessages) &&
        v.maxImageMessages + v.maxVoiceMessages > v.maxMonthlyMessages
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['maxVoiceMessages'],
          message: 'Image + voice must not exceed total monthly messages',
        });
      }
    }
    if (v.duration === 'CUSTOM_DAYS') {
      if (!v.isTrial) {
        ctx.addIssue({
          code: 'custom',
          path: ['duration'],
          message: 'Custom day counts are only allowed on trial plans',
        });
      }
      if (v.customDurationDays == null) {
        ctx.addIssue({
          code: 'custom',
          path: ['customDurationDays'],
          message: 'Required for a custom duration',
        });
      }
    }
    // Mirrors the server rule — the TRIAL tier and the trial flag are one fact.
    if ((v.tier === 'TRIAL') !== v.isTrial) {
      ctx.addIssue({
        code: 'custom',
        path: ['tier'],
        message: 'The TRIAL tier and the free-trial toggle must agree',
      });
    }
    if (v.isTrial && v.price !== 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['price'],
        message: 'A trial plan must be priced at 0',
      });
    }
    if (v.isTrial && v.originalPrice != null) {
      ctx.addIssue({
        code: 'custom',
        path: ['originalPrice'],
        message: 'Trial plans cannot run an offer',
      });
    }
    if (v.originalPrice != null && v.originalPrice <= v.price) {
      ctx.addIssue({
        code: 'custom',
        path: ['originalPrice'],
        message: 'Actual price must be higher than the discounted price',
      });
    }
    if (v.offerEndsAt != null && v.originalPrice == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['offerEndsAt'],
        message: 'Set an actual (pre-discount) price to run an offer',
      });
    }
  });

export type PlanFormValues = z.infer<typeof planFormSchema>;

export const emptyPlanDefaults = (): PlanFormValues => ({
  name: '',
  tier: 'STARTER',
  businessVertical: UNIVERSAL,
  tagline: '',
  price: 0,
  originalPrice: null,
  offerEndsAt: null,
  wholesalePrice: 0,
  currency: 'PKR',
  duration: 'MONTHLY',
  customDurationDays: null,
  isTrial: false,
  maxWorkspaces: 1,
  maxMembersPerWorkspace: 5,
  maxChannels: 1,
  maxProducts: 100,
  maxMenuItems: 100,
  maxServices: 100,
  maxClinicalServices: 100,
  maxMonthlyMessages: 1000,
  maxImageMessages: 200,
  maxVoiceMessages: 200,
  features: [],
  ctaLabel: 'Upgrade Now',
  isFeatured: false,
  isComingSoon: false,
  isPublic: true,
  isActive: true,
});

export const planToFormValues = (plan: Plan): PlanFormValues => ({
  name: plan.name,
  tier: plan.tier,
  businessVertical: plan.businessVertical ?? UNIVERSAL,
  tagline: plan.tagline ?? '',
  price: plan.price,
  originalPrice: plan.originalPrice,
  offerEndsAt: plan.offerEndsAt ? new Date(plan.offerEndsAt) : null,
  wholesalePrice: plan.wholesalePrice,
  currency: plan.currency ?? 'PKR',
  duration: plan.duration,
  customDurationDays: plan.customDurationDays,
  isTrial: plan.isTrial,
  maxWorkspaces: plan.maxWorkspaces,
  maxMembersPerWorkspace: plan.maxMembersPerWorkspace,
  maxChannels: plan.maxChannels,
  maxProducts: plan.maxProducts ?? 0,
  maxMenuItems: plan.maxMenuItems ?? 0,
  maxServices: plan.maxServices ?? 0,
  maxClinicalServices: plan.maxClinicalServices ?? 0,
  maxMonthlyMessages: plan.maxMonthlyMessages,
  maxImageMessages: plan.maxImageMessages,
  maxVoiceMessages: plan.maxVoiceMessages,
  features: (plan.features ?? []).map(value => ({ value })),
  ctaLabel: plan.ctaLabel ?? '',
  isFeatured: plan.isFeatured ?? false,
  isComingSoon: plan.isComingSoon ?? false,
  isPublic: plan.isPublic,
  isActive: plan.isActive,
});

/** Maps form values to the API payload the server's planInputSchema expects. */
export const formValuesToPlanInput = (v: PlanFormValues, existingPlan?: Plan): PlanInput => {
  const businessVertical = v.businessVertical === UNIVERSAL ? null : v.businessVertical;
  const hasOffer = !v.isTrial && v.originalPrice != null;

  return {
    name: v.name,
    tier: v.tier,
    businessVertical,
    maxWorkspaces: v.maxWorkspaces,
    maxMembersPerWorkspace: v.maxMembersPerWorkspace,
    maxChannels: v.maxChannels,
    // The server rejects a catalogue count that doesn't belong to the plan's
    // vertical, so send only the applicable one(s).
    maxProducts:
      businessVertical === null || businessVertical === 'ECOMMERCE' ? v.maxProducts : null,
    maxMenuItems:
      businessVertical === null || businessVertical === 'RESTAURANT' ? v.maxMenuItems : null,
    maxServices:
      businessVertical === null || businessVertical === 'MARKETING_AGENCY' ? v.maxServices : null,
    maxClinicalServices:
      businessVertical === null || businessVertical === 'HEALTHCARE' ? v.maxClinicalServices : null,
    maxMonthlyMessages: v.maxMonthlyMessages,
    maxImageMessages: v.maxImageMessages,
    maxVoiceMessages: v.maxVoiceMessages,
    duration: v.duration,
    customDurationDays: v.duration === 'CUSTOM_DAYS' ? v.customDurationDays : null,
    isTrial: v.isTrial,
    price: v.price,
    wholesalePrice: v.wholesalePrice,
    currency: v.currency,
    originalPrice: hasOffer ? v.originalPrice : null,
    offerEndsAt: hasOffer && v.offerEndsAt ? v.offerEndsAt.toISOString() : null,
    tagline: v.tagline.trim() || null,
    ctaLabel: v.ctaLabel.trim() || null,
    isFeatured: v.isFeatured,
    isComingSoon: v.isComingSoon,
    features: v.features.map(f => f.value.trim()).filter(Boolean),
    // Reseller / white-label are not part of the current offering — kept
    // false until those tiers ship.
    canResell: false,
    canWhitelabel: false,
    isPublic: v.isPublic,
    isActive: v.isActive,
    isSystem: existingPlan?.isSystem ?? true,
  };
};
