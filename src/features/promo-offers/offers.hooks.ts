import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import {
  createPromoOffer,
  endPromoOffer,
  getActivePromoOffer,
  listPromoOffers,
} from './offers.api';
import type { CreatePromoOfferInput } from './types';

const keys = {
  all: ['promo-offers'] as const,
  active: ['promo-offers', 'active'] as const,
};

export function usePromoOffers() {
  return useQuery({ queryKey: keys.all, queryFn: listPromoOffers });
}

/**
 * The running campaign. Refetched on focus so an admin who left the tab open
 * isn't looking at a countdown for something that already ended.
 */
export function useActivePromoOffer() {
  return useQuery({
    queryKey: keys.active,
    queryFn: getActivePromoOffer,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useCreatePromoOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePromoOfferInput) => createPromoOffer(input),
    onSuccess: () => {
      // Plans are priced off the campaign, so their cached prices are stale too.
      queryClient.invalidateQueries({ queryKey: keys.all });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Offer is now live');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useEndPromoOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => endPromoOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Offer ended');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}
