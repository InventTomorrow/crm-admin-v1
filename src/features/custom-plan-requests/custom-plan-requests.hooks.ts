import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import {
  approveCustomPlanRequest,
  listCustomPlanRequests,
  rejectCustomPlanRequest,
  type ApproveCustomPlanRequestInput,
  type CustomPlanRequestListParams,
} from './custom-plan-requests.api';

const CUSTOM_PLAN_REQUESTS_QUERY_KEY = 'custom-plan-requests';

export function useCustomPlanRequests(params: CustomPlanRequestListParams) {
  return useQuery({
    queryKey: [CUSTOM_PLAN_REQUESTS_QUERY_KEY, params],
    queryFn: () => listCustomPlanRequests(params),
    placeholderData: keepPreviousData,
  });
}

export function useApproveCustomPlanRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ApproveCustomPlanRequestInput }) =>
      approveCustomPlanRequest(id, input),
    onSuccess: () => {
      // Approval creates a plan and a checkout link, so both lists are stale too.
      queryClient.invalidateQueries({ queryKey: [CUSTOM_PLAN_REQUESTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['checkout-links'] });
      toast.success('Custom plan created with a checkout link');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useRejectCustomPlanRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectCustomPlanRequest(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CUSTOM_PLAN_REQUESTS_QUERY_KEY] });
      toast.success('Request rejected');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}
