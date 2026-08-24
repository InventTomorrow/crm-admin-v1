import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import {
  createPaymentAccount,
  deletePaymentAccount,
  listPaymentAccounts,
  reorderPaymentAccounts,
  updatePaymentAccount,
} from './accounts.api';
import type { PaymentAccount, PaymentAccountInput } from './types';

const keys = { all: ['payment-accounts'] as const };

export function usePaymentAccounts() {
  return useQuery({ queryKey: keys.all, queryFn: listPaymentAccounts });
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
    onMutate: async (orderedIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: keys.all });
      const previousAccounts = queryClient.getQueryData<PaymentAccount[]>(keys.all);

      if (previousAccounts) {
        const byId = new Map(previousAccounts.map(account => [account.id, account]));
        const reordered = orderedIds
          .map(id => byId.get(id))
          .filter((account): account is PaymentAccount => !!account);
        queryClient.setQueryData(keys.all, reordered);
      }

      return { previousAccounts };
    },
    onError: (error, _orderedIds, context) => {
      if (context?.previousAccounts) queryClient.setQueryData(keys.all, context.previousAccounts);
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
