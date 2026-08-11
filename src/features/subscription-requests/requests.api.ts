import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import type { BusinessVertical, Paged, PlanTier, Subscription } from '@/lib/types';

export const REQUEST_STATUSES = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED'] as const;
export type SubscriptionRequestStatus = (typeof REQUEST_STATUSES)[number];

export interface SubscriptionRequest {
  id: string;
  linkId: string | null;
  planId: string;
  ownerUserId: string | null;

  customerName: string;
  customerEmail: string;
  customerPhone: string;
  businessName: string | null;
  businessVertical: BusinessVertical | null;

  paymentMethod: string;
  paymentReference: string | null;
  paymentAmount: number;
  currency: string;
  receiptUrl: string;
  customerNote: string | null;

  status: SubscriptionRequestStatus;
  reviewedAt: string | null;
  reviewNote: string | null;
  subscriptionId: string | null;
  createdAt: string;

  plan?: { id: string; name: string; tier: PlanTier; price: number; currency: string };
  owner?: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
  link?: { id: string; token: string } | null;
}

export async function listSubscriptionRequests(params: {
  page: number;
  limit: number;
  status?: SubscriptionRequestStatus;
}): Promise<Paged<SubscriptionRequest>> {
  const { data } = await apiClient.get<ApiEnvelope<SubscriptionRequest[]>>(
    '/admin/subscription-requests',
    { params }
  );
  return { items: data.data, meta: data.meta! };
}

export async function getSubscriptionRequest(id: string): Promise<SubscriptionRequest> {
  const { data } = await apiClient.get<ApiEnvelope<SubscriptionRequest>>(
    `/admin/subscription-requests/${id}`
  );
  return data.data;
}

/** `ownerUserId` is required only when the link had no CRM account attached. */
export async function approveSubscriptionRequest(
  id: string,
  input: { ownerUserId?: string }
): Promise<Subscription> {
  const { data } = await apiClient.post<ApiEnvelope<Subscription>>(
    `/admin/subscription-requests/${id}/approve`,
    input
  );
  return data.data;
}

export async function rejectSubscriptionRequest(
  id: string,
  input: { reason: string }
): Promise<SubscriptionRequest> {
  const { data } = await apiClient.post<ApiEnvelope<SubscriptionRequest>>(
    `/admin/subscription-requests/${id}/reject`,
    input
  );
  return data.data;
}
