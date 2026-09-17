import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import {
  createCheckoutLink,
  listCheckoutLinks,
  revokeCheckoutLink,
  type CheckoutLinkListFilters,
} from './links.api';

export function useCheckoutLinks(
  params: CheckoutLinkListFilters & { page: number; limit: number }
) {
  return useQuery({
    queryKey: ['checkout-links', params],
    queryFn: () => listCheckoutLinks(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateCheckoutLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCheckoutLink,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checkout-links'] });
      toast.success('Checkout link created');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useRevokeCheckoutLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeCheckoutLink(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checkout-links'] });
      toast.success('Link revoked');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}
