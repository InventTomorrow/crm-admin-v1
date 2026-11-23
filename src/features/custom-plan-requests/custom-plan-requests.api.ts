import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import type { LeadPricedDuration } from '@/features/lead-pricing/lead-pricing.util';
import type { Paged, SortOrder } from '@/lib/types';

export const CUSTOM_PLAN_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type CustomPlanRequestStatus = (typeof CUSTOM_PLAN_REQUEST_STATUSES)[number];

export type CustomPlanRequestSortField = 'customer' | 'leads' | 'price' | 'submitted' | 'status';

/** Mirrors the server's CustomPlanRequest model (billing.prisma). */
export interface CustomPlanRequest {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  businessName: string | null;
  monthlyLeads: number;
  duration: LeadPricedDuration;
  customerNote: string | null;

  pricePerLead: number;
  messagesPerLead: number;
  baseFee: number;
  discountPercent: number;
  monthlyMessages: number;
  quotedPrice: number;
  currency: string;

  status: CustomPlanRequestStatus;
  reviewedAt: string | null;
  reviewNote: string | null;
  planId: string | null;
  checkoutUrl: string | null;
  createdAt: string;

  plan?: { id: string; name: string; price: number; currency: string } | null;
}

export interface CustomPlanRequestListParams {
  page: number;
  limit: number;
  search?: string;
  status?: CustomPlanRequestStatus;
  sortBy?: CustomPlanRequestSortField;
  sortOrder?: SortOrder;
}

export interface ApproveCustomPlanRequestInput {
  basePlanId: string;
  price: number;
  expiresInDays: number;
}

export async function listCustomPlanRequests(
  params: CustomPlanRequestListParams
): Promise<Paged<CustomPlanRequest>> {
  const { data } = await apiClient.get<ApiEnvelope<CustomPlanRequest[]>>(
    '/admin/custom-plan-requests',
    {
      params,
    }
  );
  return { items: data.data, meta: data.meta! };
}

export async function approveCustomPlanRequest(
  id: string,
  input: ApproveCustomPlanRequestInput
): Promise<CustomPlanRequest> {
  const { data } = await apiClient.post<ApiEnvelope<CustomPlanRequest>>(
    `/admin/custom-plan-requests/${id}/approve`,
    input
  );
  return data.data;
}

export async function rejectCustomPlanRequest(
  id: string,
  input: { reason: string }
): Promise<CustomPlanRequest> {
  const { data } = await apiClient.post<ApiEnvelope<CustomPlanRequest>>(
    `/admin/custom-plan-requests/${id}/reject`,
    input
  );
  return data.data;
}
