import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import type { Paged, Subscription, SubscriptionStatus } from '@/lib/types';

export async function listSubscriptions(params: {
  page: number;
  limit: number;
  status?: SubscriptionStatus;
  ownerUserId?: string;
}): Promise<Paged<Subscription>> {
  const { data } = await apiClient.get<ApiEnvelope<Subscription[]>>('/admin/subscriptions', {
    params,
  });
  return { items: data.data, meta: data.meta! };
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

/**
 * Workflow 1 (admin-initiated): the subscription activates immediately and
 * records the payment the admin already collected. Status is derived by the
 * server — trial plans become TRIALING, everything else ACTIVE.
 */
export async function createSubscription(input: {
  ownerUserId: string;
  planId: string;
  payment: {
    method: PaymentMethod;
    amount: number;
    currency: string;
    reference?: string;
    notes?: string;
  };
}): Promise<Subscription> {
  const { data } = await apiClient.post<ApiEnvelope<Subscription>>('/admin/subscriptions', input);
  return data.data;
}

export async function updateSubscription(
  id: string,
  input: {
    planId?: string;
    status?: SubscriptionStatus;
    /** ISO strings, or null to clear. Editing these is how a manual plan is renewed. */
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
