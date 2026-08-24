import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import type { Paged, PlanDuration, PlanTier } from '@/lib/types';

export const LINK_STATUSES = ['ACTIVE', 'USED', 'REVOKED', 'EXPIRED'] as const;
export type CheckoutLinkStatus = (typeof LINK_STATUSES)[number];

export const LINK_SOURCES = ['ADMIN', 'SELF_SERVE'] as const;
export type CheckoutLinkSource = (typeof LINK_SOURCES)[number];

export interface CheckoutLink {
  id: string;
  token: string;
  url: string;
  planId: string;
  ownerUserId: string | null;
  /** Plan periods sold by this link. Null on links minted before multi-period selling. */
  periodCount: number | null;
  status: CheckoutLinkStatus;
  source: CheckoutLinkSource;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  plan?: {
    id: string;
    name: string;
    tier: PlanTier;
    price: number;
    currency: string;
    duration?: PlanDuration;
  };
  owner?: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
}

export async function listCheckoutLinks(params: {
  page: number;
  limit: number;
  status?: CheckoutLinkStatus;
  source?: CheckoutLinkSource;
}): Promise<Paged<CheckoutLink>> {
  const { data } = await apiClient.get<ApiEnvelope<CheckoutLink[]>>('/admin/checkout-links', {
    params,
  });
  return { items: data.data, meta: data.meta! };
}

export async function createCheckoutLink(input: {
  planId: string;
  ownerUserId?: string;
  periodCount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  expiresInDays: number;
}): Promise<CheckoutLink> {
  const { data } = await apiClient.post<ApiEnvelope<CheckoutLink>>('/admin/checkout-links', input);
  return data.data;
}

export async function revokeCheckoutLink(id: string): Promise<CheckoutLink> {
  const { data } = await apiClient.post<ApiEnvelope<CheckoutLink>>(
    `/admin/checkout-links/${id}/revoke`
  );
  return data.data;
}
