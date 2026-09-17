import type { BadgeTone } from '@/components/ui/badge';
import type { BusinessVertical, PlanTier, SubscriptionStatus } from './types';

/** Filter dropdown options. Mirror of the server's BusinessVertical enum. */
export const BUSINESS_VERTICALS: BusinessVertical[] = [
  'ECOMMERCE',
  'RESTAURANT',
  'MARKETING_AGENCY',
  'HEALTHCARE',
];

export const PLAN_TIERS: PlanTier[] = ['TRIAL', 'STARTER', 'GROWTH', 'AGENCY', 'RESELLER'];

/** The shape both the users list and the dashboard widget carry. */
export interface PlanSummary {
  status: SubscriptionStatus;
  plan: { name: string; isTrial: boolean };
}

/**
 * Whether an account is on a plan it pays for. Trials are excluded on purpose —
 * they get the plan badge, but not the paid-account avatar ring.
 */
export function isOnPaidPlan(subscription: PlanSummary | null | undefined): boolean {
  if (!subscription) return false;
  return subscription.status === 'ACTIVE' && !subscription.plan.isTrial;
}

/** Label for the plan badge, including the trial case. */
export function planLabel(subscription: PlanSummary | null | undefined): string {
  if (!subscription) return 'No plan';
  return subscription.status === 'TRIALING'
    ? `${subscription.plan.name} (Trial)`
    : subscription.plan.name;
}

export function planTone(subscription: PlanSummary | null | undefined): BadgeTone {
  if (!subscription) return 'neutral';
  if (subscription.status === 'TRIALING') return 'warning';
  return subscription.status === 'ACTIVE' ? 'success' : 'neutral';
}
