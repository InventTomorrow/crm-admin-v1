import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import {
  createAffiliate,
  createAffiliatePayout,
  createReferralCode,
  deleteAffiliate,
  deleteReferralCode,
  getAffiliate,
  getAffiliateAnalytics,
  getProgramOverview,
  getReferralStackingMode,
  listAffiliatePayouts,
  listAffiliateReferrals,
  listAffiliates,
  listReferralCodes,
  updateAffiliate,
  updateReferralCode,
  updateReferralStackingMode,
  type AffiliateInput,
  type AnalyticsRange,
  type PayoutInput,
  type ReferralCodeInput,
} from './affiliates.api';
import type { AffiliateListFilters, ReferralStatus } from './types';

// One root key so any affiliate mutation refreshes lists, KPIs and analytics together.
const AFFILIATES_KEY = 'affiliates';

export function useAffiliates(params: AffiliateListFilters & { page: number; limit: number }) {
  return useQuery({
    queryKey: [AFFILIATES_KEY, 'list', params],
    queryFn: () => listAffiliates(params),
    placeholderData: keepPreviousData,
  });
}

export function useProgramOverview() {
  return useQuery({ queryKey: [AFFILIATES_KEY, 'overview'], queryFn: getProgramOverview });
}

export function useAffiliate(affiliateId: string) {
  return useQuery({
    queryKey: [AFFILIATES_KEY, 'detail', affiliateId],
    queryFn: () => getAffiliate(affiliateId),
    enabled: Boolean(affiliateId),
  });
}

export function useAffiliateAnalytics(affiliateId: string, range: AnalyticsRange) {
  return useQuery({
    queryKey: [AFFILIATES_KEY, 'analytics', affiliateId, range],
    queryFn: () => getAffiliateAnalytics(affiliateId, range),
    enabled: Boolean(affiliateId),
    placeholderData: keepPreviousData,
  });
}

export function useAffiliateReferrals(
  affiliateId: string,
  params: { page: number; limit: number; status?: ReferralStatus }
) {
  return useQuery({
    queryKey: [AFFILIATES_KEY, 'referrals', affiliateId, params],
    queryFn: () => listAffiliateReferrals(affiliateId, params),
    enabled: Boolean(affiliateId),
    placeholderData: keepPreviousData,
  });
}

export function useReferralCodes(affiliateId: string) {
  return useQuery({
    queryKey: [AFFILIATES_KEY, 'codes', affiliateId],
    queryFn: () => listReferralCodes(affiliateId),
    enabled: Boolean(affiliateId),
  });
}

export function useAffiliatePayouts(affiliateId: string) {
  return useQuery({
    queryKey: [AFFILIATES_KEY, 'payouts', affiliateId],
    queryFn: () => listAffiliatePayouts(affiliateId),
    enabled: Boolean(affiliateId),
  });
}

function useAffiliateMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  successMessage: string | ((result: TResult) => string)
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: [AFFILIATES_KEY] });
      toast.success(typeof successMessage === 'function' ? successMessage(result) : successMessage);
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

// The first code is optional; if it fails the affiliate still exists and the toast says why.
export function useCreateAffiliate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { affiliate: AffiliateInput; firstCode: ReferralCodeInput | null }) => {
      const affiliate = await createAffiliate(input.affiliate);
      if (!input.firstCode) return affiliate;
      try {
        await createReferralCode(affiliate.id, input.firstCode);
      } catch (error) {
        toast.error(`Affiliate added, but the code was not created: ${apiMessage(error)}`);
      }
      return affiliate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AFFILIATES_KEY] });
      toast.success('Affiliate added');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useUpdateAffiliate(affiliateId: string) {
  return useAffiliateMutation(
    (input: Partial<AffiliateInput>) => updateAffiliate(affiliateId, input),
    'Affiliate updated'
  );
}

export function useDeleteAffiliate() {
  return useAffiliateMutation(deleteAffiliate, deleteOutcome =>
    deleteOutcome.outcome === 'archived'
      ? 'Affiliate archived. Their referral history is kept.'
      : 'Affiliate deleted'
  );
}

export function useCreateReferralCode(affiliateId: string) {
  return useAffiliateMutation(
    (input: ReferralCodeInput) => createReferralCode(affiliateId, input),
    referralCode => `Code ${referralCode.code} created`
  );
}

export function useUpdateReferralCode() {
  return useAffiliateMutation(
    ({ codeId, input }: { codeId: string; input: Partial<Omit<ReferralCodeInput, 'code'>> }) =>
      updateReferralCode(codeId, input),
    'Code updated'
  );
}

export function useDeleteReferralCode() {
  return useAffiliateMutation(deleteReferralCode, deleteOutcome =>
    deleteOutcome.outcome === 'archived' ? 'Code retired. Its history is kept.' : 'Code deleted'
  );
}

export function useCreateAffiliatePayout(affiliateId: string) {
  return useAffiliateMutation(
    (input: PayoutInput) => createAffiliatePayout(affiliateId, input),
    'Commission marked as paid'
  );
}

export function useReferralStackingMode() {
  return useQuery({ queryKey: ['referral-stacking-mode'], queryFn: getReferralStackingMode });
}

export function useUpdateReferralStackingMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateReferralStackingMode,
    onSuccess: referralStackingMode => {
      queryClient.setQueryData(['referral-stacking-mode'], referralStackingMode);
      toast.success('Discount rule saved');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}
