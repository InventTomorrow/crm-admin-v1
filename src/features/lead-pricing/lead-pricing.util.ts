import { isUnlimitedLimit, UNLIMITED_LIMIT } from '@/lib/planFormat';
import type { PlanDuration } from '@/lib/types';
import type { LeadPricingRatesInput } from './lead-pricing.api';

// Mirrors server/src/modules/plans/lead-pricing.util.ts; the server recomputes every price it stores.
export const LEAD_PRICED_DURATIONS = ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL'] as const;
export type LeadPricedDuration = (typeof LEAD_PRICED_DURATIONS)[number];

export const LEAD_PRICED_DURATION_LABEL: Record<LeadPricedDuration, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  SEMI_ANNUAL: '6 months',
  ANNUAL: 'Annual',
};

const DURATION_MONTHS: Record<LeadPricedDuration, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  SEMI_ANNUAL: 6,
  ANNUAL: 12,
};

export const DEFAULT_MESSAGES_PER_LEAD = 10;
export const MAX_LEAD_PLAN_DISCOUNT_PERCENT = 90;

export const LEAD_PLAN_DISCOUNT_FIELD = {
  QUARTERLY: 'quarterlyDiscountPercent',
  SEMI_ANNUAL: 'semiAnnualDiscountPercent',
  ANNUAL: 'annualDiscountPercent',
} as const satisfies Partial<Record<LeadPricedDuration, keyof LeadPricingRatesInput>>;

export interface LeadPlanQuote {
  monthlyLeads: number;
  monthlyMessages: number;
  months: number;
  leadsCostPerMonth: number;
  baseFeePerMonth: number;
  monthlyPrice: number;
  listPrice: number;
  discountPercent: number;
  discountAmount: number;
  totalPrice: number;
  effectiveMonthlyPrice: number;
}

const roundMoney = (amount: number): number => Math.round(amount * 100) / 100;

export function isLeadPricedDuration(duration: PlanDuration): duration is LeadPricedDuration {
  return (LEAD_PRICED_DURATIONS as readonly PlanDuration[]).includes(duration);
}

export function getMessagesForLeads(monthlyLeads: number, messagesPerLead: number): number {
  return isUnlimitedLimit(monthlyLeads) ? UNLIMITED_LIMIT : monthlyLeads * messagesPerLead;
}

export function getDurationDiscountPercent(
  duration: LeadPricedDuration,
  rates: LeadPricingRatesInput
): number {
  return duration === 'MONTHLY' ? 0 : rates[LEAD_PLAN_DISCOUNT_FIELD[duration]];
}

/** "Quarterly 5%, 6 months 10%" for the discounts that are set; null when none are. */
export function describeLeadPlanDiscounts(rates: LeadPricingRatesInput): string | null {
  const setDiscounts = (
    Object.keys(LEAD_PLAN_DISCOUNT_FIELD) as (keyof typeof LEAD_PLAN_DISCOUNT_FIELD)[]
  )
    .map(duration => ({ duration, percent: rates[LEAD_PLAN_DISCOUNT_FIELD[duration]] }))
    .filter(discount => discount.percent > 0);
  if (setDiscounts.length === 0) return null;
  return setDiscounts
    .map(discount => `${LEAD_PRICED_DURATION_LABEL[discount.duration]} ${discount.percent}%`)
    .join(', ');
}

export function getLeadPlanQuote(
  monthlyLeads: number,
  duration: LeadPricedDuration,
  rates: LeadPricingRatesInput
): LeadPlanQuote {
  const months = DURATION_MONTHS[duration];
  const leadsCostPerMonth = roundMoney(monthlyLeads * rates.pricePerLead);
  const monthlyPrice = roundMoney(leadsCostPerMonth + rates.baseFee);
  const listPrice = roundMoney(monthlyPrice * months);
  const discountPercent = getDurationDiscountPercent(duration, rates);
  const discountAmount = roundMoney((listPrice * discountPercent) / 100);
  const totalPrice = roundMoney(listPrice - discountAmount);
  return {
    monthlyLeads,
    monthlyMessages: getMessagesForLeads(monthlyLeads, rates.messagesPerLead),
    months,
    leadsCostPerMonth,
    baseFeePerMonth: rates.baseFee,
    monthlyPrice,
    listPrice,
    discountPercent,
    discountAmount,
    totalPrice,
    effectiveMonthlyPrice: roundMoney(totalPrice / months),
  };
}
