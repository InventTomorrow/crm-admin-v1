import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import { useInvalidateBilling } from '@/lib/useInvalidateBilling';
import type {
  Paged,
  SubscriptionListItem,
  SubscriptionSortField,
  SubscriptionStatus,
} from '@/lib/types';
import {
  cancelSubscriptionAtPeriodEnd,
  deleteSubscription,
  getSubscriptionPriceQuote,
  getSubscriptionRevenue,
  listSubscriptions,
  updateSubscription,
} from './subscriptions.api';

export function useSubscriptions(params: {
  page: number;
  search?: string;
  status?: SubscriptionStatus;
  planId?: string;
  ownerUserId?: string;
  limit?: number;
  sortBy?: SubscriptionSortField;
  sortOrder?: 'asc' | 'desc';
}) {
  const limit = params.limit ?? 20;
  const sortBy = params.sortBy ?? 'createdAt';
  const sortOrder = params.sortOrder ?? 'desc';
  const search = params.search || undefined;
  return useQuery({
    queryKey: [
      'subscriptions',
      params.page,
      search ?? '',
      params.status ?? 'ALL',
      params.planId ?? 'ALL',
      params.ownerUserId ?? 'ALL',
      limit,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      listSubscriptions({
        page: params.page,
        limit,
        search,
        status: params.status,
        planId: params.planId,
        ownerUserId: params.ownerUserId,
        sortBy,
        sortOrder,
      }),
    placeholderData: keepPreviousData,
  });
}

/** Platform revenue KPIs. Its own key so a row edit doesn't refetch it. */
export function useSubscriptionRevenue(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['subscription-revenue'],
    queryFn: getSubscriptionRevenue,
    enabled: options.enabled ?? true,
  });
}

export function useSubscriptionPriceQuote(params: {
  ownerUserId: string;
  planId: string;
  periodCount: number;
}) {
  return useQuery({
    queryKey: ['subscription-price-quote', params],
    queryFn: () => getSubscriptionPriceQuote(params),
    enabled: Boolean(params.ownerUserId && params.planId && params.periodCount > 0),
  });
}

/** Plan move and/or period-end edit from the manage dialog. */
export function useManageSubscription() {
  const invalidateBilling = useInvalidateBilling();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Parameters<typeof updateSubscription>[1]) =>
      updateSubscription(id, input),
    onSuccess: () => {
      invalidateBilling();
      toast.success('Subscription updated');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useCancelSubscriptionAtPeriodEnd() {
  const invalidateBilling = useInvalidateBilling();
  return useMutation({
    mutationFn: (id: string) => cancelSubscriptionAtPeriodEnd(id),
    onSuccess: () => {
      invalidateBilling();
      toast.success('Subscription will end at the close of the current period');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useDeleteSubscription() {
  const invalidateBilling = useInvalidateBilling();
  return useMutation({
    mutationFn: (id: string) => deleteSubscription(id),
    onSuccess: () => {
      invalidateBilling();
      toast.success('Subscription deleted');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

/** Inline status change — optimistic across every cached subscriptions page. */
export function useUpdateSubscriptionStatus() {
  const qc = useQueryClient();
  const invalidateBilling = useInvalidateBilling();
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
    onSettled: () => invalidateBilling(),
  });
}
