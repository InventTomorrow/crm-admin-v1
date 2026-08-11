import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import {
  approveSubscriptionRequest,
  listSubscriptionRequests,
  rejectSubscriptionRequest,
  type SubscriptionRequestStatus,
} from './requests.api';

export function useSubscriptionRequests(params: {
  page: number;
  limit: number;
  status?: SubscriptionRequestStatus;
}) {
  return useQuery({
    queryKey: ['subscription-requests', params.page, params.limit, params.status],
    queryFn: () => listSubscriptionRequests(params),
  });
}

/** Approving also creates the Subscription, so the subscriptions list is stale too. */
function useInvalidateRequests() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['subscription-requests'] });
    qc.invalidateQueries({ queryKey: ['subscriptions'] });
    qc.invalidateQueries({ queryKey: ['checkout-links'] });
  };
}

export function useApproveRequest() {
  const invalidate = useInvalidateRequests();
  return useMutation({
    mutationFn: ({ id, ownerUserId }: { id: string; ownerUserId?: string }) =>
      approveSubscriptionRequest(id, { ownerUserId }),
    onSuccess: () => {
      invalidate();
      toast.success('Subscription approved and activated');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useRejectRequest() {
  const invalidate = useInvalidateRequests();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectSubscriptionRequest(id, { reason }),
    onSuccess: () => {
      invalidate();
      toast.success('Request rejected');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}
