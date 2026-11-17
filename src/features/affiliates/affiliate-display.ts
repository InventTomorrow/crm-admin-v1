import type { BadgeTone } from '@/components/ui/badge';
import type { AffiliateStatus, ReferralCode, ReferralStatus } from './types';

export const AFFILIATE_STATUS_TONE: Record<AffiliateStatus, BadgeTone> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
};

export const AFFILIATE_STATUS_LABEL: Record<AffiliateStatus, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
};

export const REFERRAL_STATUS_TONE: Record<ReferralStatus, BadgeTone> = {
  SIGNED_UP: 'info',
  CONVERTED: 'success',
};

export const REFERRAL_STATUS_LABEL: Record<ReferralStatus, string> = {
  SIGNED_UP: 'Signed up',
  CONVERTED: 'Paid',
};

export type CodeAvailability = 'active' | 'paused' | 'expired' | 'limit-reached';

export const CODE_AVAILABILITY_LABEL: Record<CodeAvailability, string> = {
  active: 'Active',
  paused: 'Paused',
  expired: 'Expired',
  'limit-reached': 'Limit reached',
};

export const CODE_AVAILABILITY_TONE: Record<CodeAvailability, BadgeTone> = {
  active: 'success',
  paused: 'neutral',
  expired: 'warning',
  'limit-reached': 'warning',
};

export function codeAvailabilityOf(referralCode: ReferralCode): CodeAvailability {
  if (!referralCode.isActive) return 'paused';
  if (referralCode.expiresAt && new Date(referralCode.expiresAt).getTime() <= Date.now()) {
    return 'expired';
  }
  if (referralCode.maxRedemptions !== null && referralCode.uses >= referralCode.maxRedemptions) {
    return 'limit-reached';
  }
  return 'active';
}

/** Percent change against the previous period; null when there is nothing to compare. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function formatPercent(value: number | null): string {
  return value === null ? 'N/A' : `${value}%`;
}
