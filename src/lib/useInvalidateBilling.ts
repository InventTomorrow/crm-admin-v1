import { useQueryClient } from '@tanstack/react-query';

/** Any payment or plan change can add an invoice, move revenue or change a user's plan badge. */
export function useInvalidateBilling() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-revenue'] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['invoice-summary'] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };
}
