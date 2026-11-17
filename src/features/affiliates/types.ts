// Mirrors server/src/modules/admin/affiliates and modules/affiliates DTOs.

export type AffiliateStatus = 'ACTIVE' | 'PAUSED';
export type ReferralStatus = 'SIGNED_UP' | 'CONVERTED';
export type ReferralStackingMode = 'BEST_OF' | 'STACK' | 'REFERRAL_OVERRIDES';

export const MIN_REFERRAL_DISCOUNT_PERCENT = 1;
export const MAX_REFERRAL_DISCOUNT_PERCENT = 15;
export const MAX_COMMISSION_PERCENT = 50;

export interface LinkedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

export interface Affiliate {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  commissionPercent: number;
  status: AffiliateStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: LinkedUser | null;
}

export interface AffiliateStats {
  signups: number;
  conversions: number;
  revenue: number;
  commissionEarned: number;
  commissionOwed: number;
}

export interface AffiliateListItem extends Affiliate {
  codes: { id: string; code: string; discountPercent: number; isActive: boolean }[];
  stats: AffiliateStats;
}

export interface AffiliateListFilters {
  search?: string;
  status?: AffiliateStatus;
}

export interface ProgramOverview {
  activeAffiliates: number;
  signups: number;
  conversions: number;
  conversionRate: number | null;
  revenue: number;
  commissionEarned: number;
  commissionOwed: number;
}

export interface ReferralCode {
  id: string;
  code: string;
  discountPercent: number;
  affiliateId: string;
  isActive: boolean;
  maxRedemptions: number | null;
  expiresAt: string | null;
  createdAt: string;
  uses: number;
  shareUrl: string;
}

export interface PeriodTotals {
  signups: number;
  conversions: number;
  conversionRate: number | null;
  revenue: number;
  discountGiven: number;
  commissionEarned: number;
}

export interface TrendPoint {
  bucket: string;
  signups: number;
  conversions: number;
  revenue: number;
  commission: number;
}

export interface CodePerformance {
  codeId: string;
  code: string;
  discountPercent: number;
  isActive: boolean;
  isDeleted: boolean;
  signups: number;
  conversions: number;
  revenue: number;
  commission: number;
}

export interface AffiliateAnalytics {
  range: { from: string; to: string };
  granularity: 'day' | 'month';
  currency: string;
  totals: PeriodTotals;
  previousTotals: PeriodTotals;
  lifetime: {
    signups: number;
    conversions: number;
    conversionRate: number | null;
    revenue: number;
    commissionEarned: number;
    commissionPaid: number;
    commissionOwed: number;
  };
  trend: TrendPoint[];
  byPlan: { planName: string; conversions: number; revenue: number }[];
  byCode: CodePerformance[];
}

export interface Referral {
  id: string;
  status: ReferralStatus;
  discountPercent: number;
  planName: string | null;
  listAmount: number | null;
  discountAmount: number | null;
  paidAmount: number | null;
  commissionPercent: number | null;
  commissionAmount: number | null;
  currency: string;
  convertedAt: string | null;
  createdAt: string;
  referredUser: LinkedUser;
  code: { code: string };
  payout: { id: string; paidAt: string } | null;
}

export interface AffiliatePayout {
  id: string;
  amount: number;
  currency: string;
  method: string | null;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  _count: { referrals: number };
}

export interface DeleteOutcome {
  outcome: 'deleted' | 'archived';
}
