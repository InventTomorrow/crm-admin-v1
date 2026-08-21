import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import {
  createPaymentAccount,
  deletePaymentAccount,
  listPaymentAccounts,
  updatePaymentAccount,
} from './accounts.api';
import type { PaymentAccountInput } from './types';

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
