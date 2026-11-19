import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { lookupUsers } from '@/features/users/users.api';
import { apiMessage } from '@/lib/apiClient';
import type { UserLookupItem } from '@/lib/types';
import { useDebounce } from '@/lib/useDebounce';
import {
  approveAffiliateApplication,
  createAffiliate,
  createAffiliatePayout,
  createReferralCode,
  deleteAffiliate,
  deleteReferralCode,
  downloadAffiliateStatement,
  forceDeleteAffiliate,
  getAffiliate,
  getAffiliateAnalytics,
  getProgramOverview,
  getReferralStackingMode,
  inviteAffiliate,
  issueAffiliatePasswordReset,
  listAffiliateApplications,
  listAffiliatePayouts,
  listAffiliateReferrals,
  listAffiliates,
  listReferralCodes,
  rejectAffiliateApplication,
  revokeAffiliateInvite,
  updateAffiliate,
  updateReferralCode,
  updateReferralStackingMode,
  type AffiliateInput,
  type AffiliateInviteInput,
  type AnalyticsRange,
  type ApplicationApprovalInput,
  type PayoutInput,
  type ReferralCodeInput,
} from './affiliates.api';
import type {
  Affiliate,
  AffiliateApplicationStatus,
  AffiliateInviteResult,
  AffiliateListFilters,
  AffiliateStatus,
  ReferralStatus,
} from './types';

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

function inviteSuccessMessage(invite: AffiliateInviteResult): string {
  if (invite.outcome === 'LINKED') return 'Linked to the account that already uses this email';
  return invite.emailSent ? 'Join link emailed' : 'Join link ready to share';
}

export interface CreateAffiliateResult {
  affiliate: Affiliate;
  invite: AffiliateInviteResult | null;
}

// The affiliate and its codes save together; only the join link is an extra that may fail on its own.
export function useCreateAffiliate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      affiliate: AffiliateInput;
      codes: ReferralCodeInput[];
      invite: AffiliateInviteInput | null;
    }): Promise<CreateAffiliateResult> => {
      const affiliate = await createAffiliate({ ...input.affiliate, referralCodes: input.codes });
      // The server links an existing verified account on its own; no link is needed then.
      if (!input.invite || affiliate.userId) return { affiliate, invite: null };
      try {
        return { affiliate, invite: await inviteAffiliate(affiliate.id, input.invite) };
      } catch (error) {
        toast.error(`Affiliate added, but the join link was not created: ${apiMessage(error)}`);
        return { affiliate, invite: null };
      }
    },
    onSuccess: ({ affiliate, invite }) => {
      queryClient.invalidateQueries({ queryKey: [AFFILIATES_KEY] });
      if (affiliate.userId && !invite) {
        toast.success('Affiliate added and linked to their account');
        return;
      }
      toast.success(
        invite ? `Affiliate added. ${inviteSuccessMessage(invite)}` : 'Affiliate added'
      );
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const isEmailShaped = (email: string) => z.email().safeParse(email).success;
const existingAccountKey = (email: string) => ['users-lookup', 'exact-email', email];

// The lookup is a fuzzy search, so only an exact email match counts.
async function findAccountByEmail(email: string): Promise<UserLookupItem | null> {
  const matchingUsers = await lookupUsers({ search: email, limit: 5 });
  return matchingUsers.find(user => user.email.toLowerCase() === email) ?? null;
}

/** Spots an email that already has an account: live while typing, and again on demand before moving on. */
export function useExistingAccountForEmail(email: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const debouncedEmail = normalizeEmail(useDebounce(email, 400));
  const existingAccountQuery = useQuery({
    queryKey: existingAccountKey(debouncedEmail),
    queryFn: () => findAccountByEmail(debouncedEmail),
    enabled: enabled && isEmailShaped(debouncedEmail),
    staleTime: 60_000,
  });

  // A failed lookup never blocks the form; the server still links a verified account on its own.
  const findExistingAccountNow = (rawEmail: string): Promise<UserLookupItem | null> => {
    const email = normalizeEmail(rawEmail);
    if (!isEmailShaped(email)) return Promise.resolve(null);
    return queryClient
      .fetchQuery({
        queryKey: existingAccountKey(email),
        queryFn: () => findAccountByEmail(email),
        staleTime: 60_000,
      })
      .catch(() => null);
  };

  return {
    existingAccount: enabled ? (existingAccountQuery.data ?? null) : null,
    findExistingAccountNow,
  };
}

export function useInviteAffiliate(affiliateId: string) {
  return useAffiliateMutation(
    (input: AffiliateInviteInput) => inviteAffiliate(affiliateId, input),
    inviteSuccessMessage
  );
}

export function useIssueAffiliatePasswordReset(affiliateId: string) {
  return useAffiliateMutation(
    (sendEmail: boolean) => issueAffiliatePasswordReset(affiliateId, sendEmail),
    resetLink => (resetLink.emailSent ? 'Reset link emailed' : 'Reset link ready to share')
  );
}

export function useRevokeAffiliateInvite(affiliateId: string) {
  return useAffiliateMutation(() => revokeAffiliateInvite(affiliateId), 'Join link cancelled');
}

export function useAffiliateApplications(params: {
  page: number;
  limit: number;
  search?: string;
  status?: AffiliateApplicationStatus;
}) {
  return useQuery({
    queryKey: [AFFILIATES_KEY, 'applications', params],
    queryFn: () => listAffiliateApplications(params),
    placeholderData: keepPreviousData,
  });
}

export function useApproveAffiliateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      input,
    }: {
      applicationId: string;
      input: ApplicationApprovalInput;
    }) => approveAffiliateApplication(applicationId, input),
    onSuccess: approval => {
      queryClient.invalidateQueries({ queryKey: [AFFILIATES_KEY] });
      if (approval.inviteProblem) {
        toast.warning(`Approved, but no join link was sent: ${approval.inviteProblem}`);
        return;
      }
      toast.success(
        approval.invite
          ? `Approved. ${inviteSuccessMessage(approval.invite)}`
          : 'Application approved'
      );
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useRejectAffiliateApplication() {
  return useAffiliateMutation(
    ({ applicationId, note }: { applicationId: string; note?: string }) =>
      rejectAffiliateApplication(applicationId, note),
    'Application rejected'
  );
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

export function useSetAffiliateStatus(affiliateId: string) {
  return useAffiliateMutation(
    (status: AffiliateStatus) => updateAffiliate(affiliateId, { status }),
    updatedAffiliate =>
      updatedAffiliate.status === 'PAUSED' ? 'Affiliate suspended' : 'Affiliate reactivated'
  );
}

export function useDownloadAffiliateStatement() {
  return useMutation({
    mutationFn: downloadAffiliateStatement,
    onSuccess: () => toast.success('Statement downloaded'),
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useForceDeleteAffiliate() {
  return useAffiliateMutation(
    (input: { affiliateId: string; confirmName: string }) =>
      forceDeleteAffiliate(input.affiliateId, input.confirmName),
    'Affiliate and all their records deleted'
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
