import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import type { Paged, Subscription, SubscriptionStatus } from '@/lib/types';
import {
  cancelSubscriptionAtPeriodEnd,
  createSubscription,
  deleteSubscription,
  listSubscriptions,
  updateSubscription,
} from './subscriptions.api';

export function useSubscriptions(params: {
  page: number;
  status?: SubscriptionStatus;
  limit?: number;
}) {
  const limit = params.limit ?? 20;
  return useQuery({
    queryKey: ['subscriptions', params.page, params.status ?? 'ALL', limit],
    queryFn: () => listSubscriptions({ page: params.page, limit, status: params.status }),
  });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createSubscription>[0]) => createSubscription(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Subscription created');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

/** Plan move and/or period-end edit from the manage dialog. */
export function useManageSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Parameters<typeof updateSubscription>[1]) =>
      updateSubscription(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Subscription updated');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useCancelSubscriptionAtPeriodEnd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelSubscriptionAtPeriodEnd(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Subscription will end at the close of the current period');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useDeleteSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSubscription(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Subscription deleted');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

/** Inline status change — optimistic across every cached subscriptions page. */
export function useUpdateSubscriptionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SubscriptionStatus }) =>
      updateSubscription(id, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['subscriptions'] });
      const snapshots = qc.getQueriesData<Paged<Subscription>>({ queryKey: ['subscriptions'] });
      qc.setQueriesData<Paged<Subscription>>({ queryKey: ['subscriptions'] }, cached =>
        cached
          ? {
              ...cached,
              items: cached.items.map(subscription =>
                subscription.id === id ? { ...subscription, status } : subscription
              ),
            }
          : cached
      );
      return { snapshots };
    },
    onError: (error, _variables, context) => {
      context?.snapshots.forEach(([queryKey, cached]) => qc.setQueryData(queryKey, cached));
      toast.error(apiMessage(error));
    },
    onSuccess: () => toast.success('Subscription updated'),
    onSettled: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  });
}
