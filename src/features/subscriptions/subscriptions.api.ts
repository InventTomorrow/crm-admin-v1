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
  input: { planId?: string; status?: SubscriptionStatus }
): Promise<Subscription> {
  const { data } = await apiClient.patch<ApiEnvelope<Subscription>>(
    `/admin/subscriptions/${id}`,
    input
  );
  return data.data;
}
