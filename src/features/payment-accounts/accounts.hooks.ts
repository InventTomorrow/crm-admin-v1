import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import {
  createPaymentAccount,
  deletePaymentAccount,
  listPaymentAccounts,
  reorderPaymentAccounts,
  updatePaymentAccount,
  type PaymentAccountFilters,
} from './accounts.api';
import type { PaymentAccount, PaymentAccountInput } from './types';

const keys = { all: ['payment-accounts'] as const };

export function usePaymentAccounts(filters: PaymentAccountFilters = {}) {
  return useQuery({
    queryKey: [...keys.all, filters],
    queryFn: () => listPaymentAccounts(filters),
    placeholderData: keepPreviousData,
  });
}

export function useSavePaymentAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: PaymentAccountInput }) =>
      id ? updatePaymentAccount(id, input) : createPaymentAccount(input),
    onSuccess: (_account, { id }) => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      toast.success(id ? 'Account updated' : 'Account added');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

/**
 * Reordering is driven from the list, so the cards have to move under the
 * cursor — the new order is written to the cache before the request goes out.
 */
export function useReorderPaymentAccounts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderPaymentAccounts(orderedIds),
    // The filters are part of the query key, so this patches every cached
    // variation rather than one exact key.
    onMutate: async (orderedIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: keys.all });
      const snapshots = queryClient.getQueriesData<PaymentAccount[]>({ queryKey: keys.all });

      queryClient.setQueriesData<PaymentAccount[]>({ queryKey: keys.all }, cached => {
        if (!cached) return cached;
        const byId = new Map(cached.map(account => [account.id, account]));
        return orderedIds
          .map(id => byId.get(id))
          .filter((account): account is PaymentAccount => !!account);
      });

      return { snapshots };
    },
    onError: (error, _orderedIds, context) => {
      context?.snapshots.forEach(([queryKey, cached]) =>
        queryClient.setQueryData(queryKey, cached)
      );
      toast.error(apiMessage(error));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useDeletePaymentAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePaymentAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      toast.success('Account removed');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}
