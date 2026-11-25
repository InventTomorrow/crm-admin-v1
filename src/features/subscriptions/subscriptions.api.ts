import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import type {
  Paged,
  Subscription,
  SubscriptionListItem,
  SubscriptionRevenue,
  SubscriptionSortField,
  SubscriptionStatus,
} from '@/lib/types';

export interface SubscriptionListFilters {
  /** Matches owner name/email and plan name. */
  search?: string;
  status?: SubscriptionStatus;
  ownerUserId?: string;
  planId?: string;
  sortBy?: SubscriptionSortField;
  sortOrder?: 'asc' | 'desc';
}

export async function listSubscriptions(
  params: SubscriptionListFilters & { page: number; limit: number }
): Promise<Paged<SubscriptionListItem>> {
  const { data } = await apiClient.get<ApiEnvelope<SubscriptionListItem[]>>(
    '/admin/subscriptions',
    {
      params,
    }
  );
  return { items: data.data, meta: data.meta! };
}

/** Platform revenue for the page header — subscription money only. */
export async function getSubscriptionRevenue(): Promise<SubscriptionRevenue> {
  const { data } = await apiClient.get<ApiEnvelope<SubscriptionRevenue>>(
    '/admin/subscriptions/revenue'
  );
  return data.data;
}

export const PAYMENT_METHODS = ['BANK_TRANSFER', 'EASYPAISA', 'JAZZCASH', 'CASH', 'OTHER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Bank transfer',
  EASYPAISA: 'Easypaisa',
  JAZZCASH: 'JazzCash',
  CASH: 'Cash',
  OTHER: 'Other',
};

/** Mirrors PriceQuote in server/src/modules/referrals/pricing-quote.service.ts. */
export interface SubscriptionPriceQuote {
  listUnitPrice: number;
  unitPrice: number;
  periodCount: number;
  listTotal: number;
  total: number;
  currency: string;
  promo: { title: string; discountPercent: number; endsAt: string } | null;
  referral: { code: string; discountPercent: number; affiliateName: string } | null;
  discountLabel: string | null;
}

/** What the account owes after its referral code and any running promo. */
export async function getSubscriptionPriceQuote(params: {
  ownerUserId: string;
  planId: string;
  periodCount: number;
}): Promise<SubscriptionPriceQuote> {
  const { data } = await apiClient.get<ApiEnvelope<SubscriptionPriceQuote>>(
    '/admin/subscriptions/quote',
    { params }
  );
  return data.data;
}

export async function updateSubscription(
  id: string,
  input: {
    planId?: string;
    status?: SubscriptionStatus;
    /** ISO strings, or null to clear. An admin override: renewals are paid through an invoice. */
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    trialEndsAt?: string | null;
  }
): Promise<Subscription> {
  const { data } = await apiClient.patch<ApiEnvelope<Subscription>>(
    `/admin/subscriptions/${id}`,
    input
  );
  return data.data;
}

/**
 * Books the subscription to lapse at the end of the period already paid for.
 * To stop one immediately, set its status to CANCELLED instead.
 */
export async function cancelSubscriptionAtPeriodEnd(id: string): Promise<Subscription> {
  const { data } = await apiClient.post<ApiEnvelope<Subscription>>(
    `/admin/subscriptions/${id}/cancel`
  );
  return data.data;
}

/** Irreversible. Payments and invoices survive, detached from the subscription. */
export async function deleteSubscription(id: string): Promise<{ id: string }> {
  const { data } = await apiClient.delete<ApiEnvelope<{ id: string }>>(
    `/admin/subscriptions/${id}`
  );
  return data.data;
}
