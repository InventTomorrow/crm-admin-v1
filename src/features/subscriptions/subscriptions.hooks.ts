import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import type {
  Paged,
  SubscriptionListItem,
  SubscriptionSortField,
  SubscriptionStatus,
} from '@/lib/types';
import {
  cancelSubscriptionAtPeriodEnd,
  createSubscription,
  deleteSubscription,
  getSubscriptionRevenue,
  listSubscriptions,
  updateSubscription,
} from './subscriptions.api';

export function useSubscriptions(params: {
  page: number;
  status?: SubscriptionStatus;
  limit?: number;
  sortBy?: SubscriptionSortField;
  sortOrder?: 'asc' | 'desc';
}) {
  const limit = params.limit ?? 20;
  const sortBy = params.sortBy ?? 'createdAt';
  const sortOrder = params.sortOrder ?? 'desc';
  return useQuery({
    queryKey: ['subscriptions', params.page, params.status ?? 'ALL', limit, sortBy, sortOrder],
    queryFn: () =>
      listSubscriptions({ page: params.page, limit, status: params.status, sortBy, sortOrder }),
  });
}

/** Platform revenue KPIs. Its own key so a row edit doesn't refetch it. */
export function useSubscriptionRevenue() {
  return useQuery({ queryKey: ['subscription-revenue'], queryFn: getSubscriptionRevenue });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createSubscription>[0]) => createSubscription(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      // A new subscription banks a payment, so the revenue tiles are stale.
      qc.invalidateQueries({ queryKey: ['subscription-revenue'] });
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
      // A plan move changes what this subscription contributes to MRR.
      qc.invalidateQueries({ queryKey: ['subscription-revenue'] });
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
      // Deleting one drops it out of MRR — payments survive, so `collected` holds.
      qc.invalidateQueries({ queryKey: ['subscription-revenue'] });
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
      const snapshots = qc.getQueriesData<Paged<SubscriptionListItem>>({
        queryKey: ['subscriptions'],
      });
      qc.setQueriesData<Paged<SubscriptionListItem>>({ queryKey: ['subscriptions'] }, cached =>
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
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      // Going live or cancelling moves the subscription in or out of MRR.
      qc.invalidateQueries({ queryKey: ['subscription-revenue'] });
    },
  });
}
