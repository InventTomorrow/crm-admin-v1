import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import type { InvoiceListItem, Paged } from '@/lib/types';
import { useInvalidateBilling } from '@/lib/useInvalidateBilling';
import {
  createInvoice,
  downloadInvoicePdf,
  getBillingSummary,
  listInvoices,
  recordInvoicePayment,
  voidInvoice,
  type InvoiceListFilters,
} from './invoices.api';

// High enough that the payment picker sees every unpaid invoice an account realistically has.
const OPEN_INVOICE_LIMIT = 50;

export function useInvoices(params: InvoiceListFilters, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => listInvoices(params),
    enabled: Boolean(params.ownerUserId) && (options.enabled ?? true),
    placeholderData: keepPreviousData,
  });
}

/** Newest first, so the first item is the payment dialog's default. */
export function useOpenInvoices(ownerUserId: string, options: { enabled?: boolean } = {}) {
  return useInvoices({ ownerUserId, status: 'OPEN', page: 1, limit: OPEN_INVOICE_LIMIT }, options);
}

export function useBillingSummary(ownerUserId: string) {
  return useQuery({
    queryKey: ['invoice-summary', ownerUserId],
    queryFn: () => getBillingSummary(ownerUserId),
    enabled: Boolean(ownerUserId),
  });
}

export function useDownloadInvoice() {
  return useMutation({
    mutationFn: downloadInvoicePdf,
    onError: () => toast.error('Could not download the invoice. Try again.'),
  });
}

export function useCreateInvoice() {
  const invalidateBilling = useInvalidateBilling();
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: outcome => {
      invalidateBilling();
      toast.success(
        outcome.status === 'PAID'
          ? `Invoice ${outcome.invoiceNumber} settled at no charge. Plan activated.`
          : `Invoice ${outcome.invoiceNumber} created`
      );
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useRecordInvoicePayment() {
  const invalidateBilling = useInvalidateBilling();
  return useMutation({
    mutationFn: ({
      invoiceId,
      ...input
    }: { invoiceId: string } & Parameters<typeof recordInvoicePayment>[1]) =>
      recordInvoicePayment(invoiceId, input),
    onSuccess: outcome => {
      invalidateBilling();
      toast.success(`Payment made for ${outcome.invoiceNumber}. Plan activated.`);
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

/** Optimistic: the row reads Cancelled at once and rolls back if the server refuses. */
export function useVoidInvoice() {
  const queryClient = useQueryClient();
  const invalidateBilling = useInvalidateBilling();
  return useMutation({
    mutationFn: (invoice: Pick<InvoiceListItem, 'id' | 'number'>) => voidInvoice(invoice.id),
    onMutate: async invoice => {
      await queryClient.cancelQueries({ queryKey: ['invoices'] });
      const snapshots = queryClient.getQueriesData<Paged<InvoiceListItem>>({
        queryKey: ['invoices'],
      });
      queryClient.setQueriesData<Paged<InvoiceListItem>>({ queryKey: ['invoices'] }, cached =>
        cached
          ? {
              ...cached,
              items: cached.items.map(cachedInvoice =>
                cachedInvoice.id === invoice.id
                  ? { ...cachedInvoice, status: 'VOID' as const }
                  : cachedInvoice
              ),
            }
          : cached
      );
      return { snapshots };
    },
    onError: (error, _invoice, context) => {
      context?.snapshots.forEach(([queryKey, cached]) =>
        queryClient.setQueryData(queryKey, cached)
      );
      toast.error(apiMessage(error));
    },
    onSuccess: (_outcome, invoice) => toast.success(`Invoice ${invoice.number} cancelled`),
    onSettled: () => invalidateBilling(),
  });
}
