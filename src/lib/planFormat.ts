import type { PlanDuration } from '@/lib/types';

const DURATION_LABEL: Record<Exclude<PlanDuration, 'CUSTOM_DAYS'>, string> = {
  DAYS_3: '3 days',
  DAYS_7: '7 days',
  DAYS_14: '14 days',
  MONTHLY: 'mo',
  QUARTERLY: 'quarter',
  SEMI_ANNUAL: '6 mo',
  ANNUAL: 'yr',
};

/** "/mo", "/7 days", "/5 days" for a custom trial — never assume monthly. */
export function formatPlanPeriod(
  duration: PlanDuration,
  customDurationDays: number | null
): string {
  if (duration === 'CUSTOM_DAYS') {
    const days = customDurationDays ?? 0;
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  return DURATION_LABEL[duration];
}

/** Days one plan period grants, mirroring the server's DURATION_DAYS. */
const DURATION_DAYS: Record<Exclude<PlanDuration, 'CUSTOM_DAYS'>, number> = {
  DAYS_3: 3,
  DAYS_7: 7,
  DAYS_14: 14,
  MONTHLY: 30,
  QUARTERLY: 90,
  SEMI_ANNUAL: 180,
  ANNUAL: 365,
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Length of one plan period in days. 0 for a CUSTOM_DAYS plan with no length set. */
export function planDurationInDays(
  duration: PlanDuration,
  customDurationDays: number | null
): number {
  if (duration === 'CUSTOM_DAYS') return customDurationDays ?? 0;
  return DURATION_DAYS[duration];
}

/**
 * End date of `count` back-to-back plan periods starting at `start`. Periods are
 * fixed day counts (a month is 30 days), matching the server's resolvePeriodEnd
 * — so a date computed here survives a round trip unchanged.
 */
export function addPlanPeriods(
  start: Date,
  duration: PlanDuration,
  customDurationDays: number | null,
  count: number
): Date | null {
  const days = planDurationInDays(duration, customDurationDays);
  if (days <= 0 || count <= 0) return null;
  return new Date(start.getTime() + days * count * DAY_MS);
}

/** How many whole plan periods `start`→`end` spans, or null when it can't be told. */
export function countPlanPeriods(
  start: Date,
  end: Date,
  duration: PlanDuration,
  customDurationDays: number | null
): number | null {
  const days = planDurationInDays(duration, customDurationDays);
  if (days <= 0) return null;
  const periods = Math.round((end.getTime() - start.getTime()) / (days * DAY_MS));
  return periods > 0 ? periods : null;
}

/** Day-length plans have no natural unit name, so they count plain periods. */
const PERIOD_COUNT_LABEL: Record<Exclude<PlanDuration, 'CUSTOM_DAYS'>, string> = {
  DAYS_3: 'Periods',
  DAYS_7: 'Periods',
  DAYS_14: 'Periods',
  MONTHLY: 'Months',
  QUARTERLY: 'Quarters',
  SEMI_ANNUAL: 'Half-years',
  ANNUAL: 'Years',
};

/** What one unit of a period count is called for this plan — "Months", "Years", … */
export function formatPlanPeriodCountLabel(duration: PlanDuration): string {
  if (duration === 'CUSTOM_DAYS') return 'Periods';
  return PERIOD_COUNT_LABEL[duration];
}

/**
 * "No cap" sentinel, mirroring the server's UNLIMITED_LIMIT
 * (server/src/modules/plans/plan-limits.util.ts). Every numeric plan limit
 * accepts it; the form writes it only when the Unlimited box is ticked.
 */
export const UNLIMITED_LIMIT = -1;

export function isUnlimitedLimit(limit: number | null | undefined): boolean {
  return limit === UNLIMITED_LIMIT;
}

/** A limit as an admin reads it. Null (field not applicable to the plan) reads as a dash. */
export function formatPlanLimit(limit: number | null, unlimitedLabel = 'Unlimited'): string {
  if (limit === null) return '—';
  return isUnlimitedLimit(limit) ? unlimitedLabel : limit.toLocaleString('en-PK');
}

/** Formats a plan price in its own currency (plans are PKR by default). */
export function formatPlanPrice(price: number, currency: string): string {
  if (currency === 'PKR') return `Rs. ${price.toLocaleString('en-PK')}`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString()}`;
  }
}
