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
