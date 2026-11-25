import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import {
  getLeadPricingRates,
  updateLeadPricingRates,
  type LeadPricingRates,
  type LeadPricingRatesInput,
} from './lead-pricing.api';

const LEAD_PRICING_QUERY_KEY = ['lead-pricing'] as const;

export function useLeadPricingRates() {
  return useQuery({
    queryKey: LEAD_PRICING_QUERY_KEY,
    queryFn: getLeadPricingRates,
    staleTime: 60_000,
  });
}

export function useUpdateLeadPricingRates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LeadPricingRatesInput) => updateLeadPricingRates(input),
    onMutate: async input => {
      await queryClient.cancelQueries({ queryKey: LEAD_PRICING_QUERY_KEY });
      const previousRates = queryClient.getQueryData<LeadPricingRates>(LEAD_PRICING_QUERY_KEY);
      if (previousRates) {
        queryClient.setQueryData<LeadPricingRates>(LEAD_PRICING_QUERY_KEY, {
          ...previousRates,
          ...input,
        });
      }
      return { previousRates };
    },
    onError: (error, _input, context) => {
      if (context?.previousRates) {
        queryClient.setQueryData(LEAD_PRICING_QUERY_KEY, context.previousRates);
      }
      toast.error(apiMessage(error));
    },
    onSuccess: savedRates => {
      queryClient.setQueryData(LEAD_PRICING_QUERY_KEY, savedRates);
      toast.success('Lead pricing saved');
    },
  });
}
