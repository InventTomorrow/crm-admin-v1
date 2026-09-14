import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import {
  addModelPricing,
  calculateHypotheticalCost,
  getExchangeRate,
  getPricingHistory,
  listCurrentPricing,
  updateExchangeRate,
  type AddModelPricingInput,
  type CalculateCostItem,
} from './ai-pricing.api';

export function useCurrentPricing() {
  return useQuery({ queryKey: ['ai-pricing'], queryFn: listCurrentPricing });
}

export function usePricingHistory(provider: string, model: string, enabled: boolean) {
  return useQuery({
    queryKey: ['ai-pricing', 'history', provider, model],
    queryFn: () => getPricingHistory(provider, model),
    enabled,
  });
}

export function useAddModelPricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddModelPricingInput) => addModelPricing(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-pricing'] });
      // Every list/detail view that shows AI cost derives from current pricing.
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['tenant'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Pricing saved');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useCalculateHypotheticalCost() {
  return useMutation({
    mutationFn: (items: CalculateCostItem[]) => calculateHypotheticalCost(items),
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useExchangeRate() {
  return useQuery({ queryKey: ['exchange-rate'], queryFn: getExchangeRate });
}

export function useUpdateExchangeRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rate: number) => updateExchangeRate(rate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exchange-rate'] });
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['tenant'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Exchange rate saved');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}
