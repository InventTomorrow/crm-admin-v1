import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import type { Paged } from '@/lib/types';
import type { PaymentMethod } from '@/features/subscriptions/subscriptions.api';
import type {
  Affiliate,
  AffiliateAnalytics,
  AffiliateApplication,
  AffiliateApplicationsPage,
  AffiliateApplicationStatus,
  AffiliateInviteResult,
  AffiliateJoinMethod,
  ApplicationApprovalResult,
  PasswordResetLink,
  AffiliateListFilters,
  AffiliateListItem,
  AffiliatePayout,
  AffiliateStatus,
  DeleteOutcome,
  ProgramOverview,
  Referral,
  ReferralCode,
  ReferralStackingMode,
  ReferralStatus,
} from './types';

export interface AffiliateInput {
  userId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  commissionPercent: number;
  selfServeMaxDiscountPercent?: number | null;
  status?: AffiliateStatus;
  notes?: string | null;
}

export interface ReferralCodeInput {
  code?: string;
  discountPercent: number;
  maxRedemptions?: number | null;
  expiresAt?: string | null;
  isActive?: boolean;
}

export interface PayoutInput {
  method?: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface AnalyticsRange {
  from: string;
  to: string;
}

export async function listAffiliates(
  params: AffiliateListFilters & { page: number; limit: number }
): Promise<Paged<AffiliateListItem>> {
  const { data } = await apiClient.get<ApiEnvelope<AffiliateListItem[]>>('/admin/affiliates', {
    params,
  });
  return { items: data.data, meta: data.meta! };
}

export async function getProgramOverview(): Promise<ProgramOverview> {
  const { data } = await apiClient.get<ApiEnvelope<ProgramOverview>>('/admin/affiliates/overview');
  return data.data;
}

export async function getAffiliate(affiliateId: string): Promise<Affiliate> {
  const { data } = await apiClient.get<ApiEnvelope<Affiliate>>(`/admin/affiliates/${affiliateId}`);
  return data.data;
}

// The server saves these with the affiliate, or generates one code when the list is empty.
export interface CreateAffiliateInput extends AffiliateInput {
  referralCodes: ReferralCodeInput[];
}

export async function createAffiliate(input: CreateAffiliateInput): Promise<Affiliate> {
  const { data } = await apiClient.post<ApiEnvelope<Affiliate>>('/admin/affiliates', input);
  return data.data;
}

export async function updateAffiliate(
  affiliateId: string,
  input: Partial<AffiliateInput>
): Promise<Affiliate> {
  const { data } = await apiClient.patch<ApiEnvelope<Affiliate>>(
    `/admin/affiliates/${affiliateId}`,
    input
  );
  return data.data;
}

export async function deleteAffiliate(affiliateId: string): Promise<DeleteOutcome> {
  const { data } = await apiClient.delete<ApiEnvelope<DeleteOutcome>>(
    `/admin/affiliates/${affiliateId}`
  );
  return data.data;
}

export async function getAffiliateAnalytics(
  affiliateId: string,
  range: AnalyticsRange
): Promise<AffiliateAnalytics> {
  const { data } = await apiClient.get<ApiEnvelope<AffiliateAnalytics>>(
    `/admin/affiliates/${affiliateId}/analytics`,
    { params: range }
  );
  return data.data;
}

export async function listAffiliateReferrals(
  affiliateId: string,
  params: { page: number; limit: number; status?: ReferralStatus }
): Promise<Paged<Referral>> {
  const { data } = await apiClient.get<ApiEnvelope<Referral[]>>(
    `/admin/affiliates/${affiliateId}/referrals`,
    { params }
  );
  return { items: data.data, meta: data.meta! };
}

export async function listReferralCodes(affiliateId: string): Promise<ReferralCode[]> {
  const { data } = await apiClient.get<ApiEnvelope<ReferralCode[]>>(
    `/admin/affiliates/${affiliateId}/codes`
  );
  return data.data;
}

export async function createReferralCode(
  affiliateId: string,
  input: ReferralCodeInput
): Promise<ReferralCode> {
  const { data } = await apiClient.post<ApiEnvelope<ReferralCode>>(
    `/admin/affiliates/${affiliateId}/codes`,
    input
  );
  return data.data;
}

export async function updateReferralCode(
  codeId: string,
  input: Partial<Omit<ReferralCodeInput, 'code'>>
): Promise<ReferralCode> {
  const { data } = await apiClient.patch<ApiEnvelope<ReferralCode>>(
    `/admin/affiliates/codes/${codeId}`,
    input
  );
  return data.data;
}

export async function deleteReferralCode(codeId: string): Promise<DeleteOutcome> {
  const { data } = await apiClient.delete<ApiEnvelope<DeleteOutcome>>(
    `/admin/affiliates/codes/${codeId}`
  );
  return data.data;
}

export async function listAffiliatePayouts(affiliateId: string): Promise<AffiliatePayout[]> {
  const { data } = await apiClient.get<ApiEnvelope<AffiliatePayout[]>>(
    `/admin/affiliates/${affiliateId}/payouts`
  );
  return data.data;
}

export async function createAffiliatePayout(
  affiliateId: string,
  input: PayoutInput
): Promise<AffiliatePayout> {
  const { data } = await apiClient.post<ApiEnvelope<AffiliatePayout>>(
    `/admin/affiliates/${affiliateId}/payouts`,
    input
  );
  return data.data;
}

export async function getReferralStackingMode(): Promise<ReferralStackingMode> {
  const { data } = await apiClient.get<ApiEnvelope<{ referralStackingMode: ReferralStackingMode }>>(
    '/admin/settings/referral-stacking'
  );
  return data.data.referralStackingMode;
}

export async function updateReferralStackingMode(
  referralStackingMode: ReferralStackingMode
): Promise<ReferralStackingMode> {
  const { data } = await apiClient.put<ApiEnvelope<{ referralStackingMode: ReferralStackingMode }>>(
    '/admin/settings/referral-stacking',
    { referralStackingMode }
  );
  return data.data.referralStackingMode;
}

export interface AffiliateInviteInput {
  method: AffiliateJoinMethod;
  sendEmail: boolean;
}

export interface ApplicationApprovalInput extends AffiliateInviteInput {
  commissionPercent: number;
}

export async function inviteAffiliate(
  affiliateId: string,
  input: AffiliateInviteInput
): Promise<AffiliateInviteResult> {
  const { data } = await apiClient.post<ApiEnvelope<AffiliateInviteResult>>(
    `/admin/affiliates/${affiliateId}/invite`,
    input
  );
  return data.data;
}

export async function revokeAffiliateInvite(affiliateId: string): Promise<void> {
  await apiClient.delete(`/admin/affiliates/${affiliateId}/invite`);
}

export async function listAffiliateApplications(params: {
  page: number;
  limit: number;
  search?: string;
  status?: AffiliateApplicationStatus;
}): Promise<AffiliateApplicationsPage> {
  const { data } = await apiClient.get<
    ApiEnvelope<{ items: AffiliateApplication[]; pendingCount: number }>
  >('/admin/affiliates/applications', { params });
  return { ...data.data, meta: data.meta! };
}

export async function approveAffiliateApplication(
  applicationId: string,
  input: ApplicationApprovalInput
): Promise<ApplicationApprovalResult> {
  const { data } = await apiClient.post<ApiEnvelope<ApplicationApprovalResult>>(
    `/admin/affiliates/applications/${applicationId}/approve`,
    input
  );
  return data.data;
}

export async function rejectAffiliateApplication(
  applicationId: string,
  note?: string
): Promise<void> {
  await apiClient.post(
    `/admin/affiliates/applications/${applicationId}/reject`,
    note ? { note } : {}
  );
}

export async function issueAffiliatePasswordReset(
  affiliateId: string,
  sendEmail: boolean
): Promise<PasswordResetLink> {
  const { data } = await apiClient.post<ApiEnvelope<PasswordResetLink>>(
    `/admin/affiliates/${affiliateId}/password-reset`,
    { sendEmail }
  );
  return data.data;
}
