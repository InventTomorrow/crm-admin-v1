import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import { downloadBlob, filenameFromDisposition } from '@/lib/download';
import type {
  BillingSummary,
  InvoiceListItem,
  InvoiceOutcome,
  InvoiceStatus,
  Paged,
} from '@/lib/types';
import type { PaymentMethod } from '@/features/subscriptions/subscriptions.api';

export interface InvoiceListFilters {
  ownerUserId: string;
  status?: InvoiceStatus;
  page: number;
  limit: number;
}

export async function listInvoices(params: InvoiceListFilters): Promise<Paged<InvoiceListItem>> {
  const { data } = await apiClient.get<ApiEnvelope<InvoiceListItem[]>>('/admin/invoices', {
    params,
  });
  return { items: data.data, meta: data.meta! };
}

/** Paid and unpaid totals, plus customer payments still awaiting approval. */
export async function getBillingSummary(ownerUserId: string): Promise<BillingSummary> {
  const { data } = await apiClient.get<ApiEnvelope<BillingSummary>>('/admin/invoices/summary', {
    params: { ownerUserId },
  });
  return data.data;
}

export async function downloadInvoicePdf(
  invoice: Pick<InvoiceListItem, 'id' | 'number'>
): Promise<void> {
  const response = await apiClient.get(`/admin/invoices/${invoice.id}/pdf`, {
    responseType: 'blob',
  });
  downloadBlob(
    response.data as Blob,
    filenameFromDisposition(response.headers['content-disposition'], `${invoice.number}.pdf`)
  );
}

/** A PKR 0 invoice comes back PAID: the server settles it and activates the plan at once. */
export async function createInvoice(input: {
  ownerUserId: string;
  planId: string;
  periodCount: number;
  amount: number;
  /** Required by the server when `amount` is under the quote and no promo or referral explains it. */
  discountReason?: string;
  dueInDays: number;
  notifyCustomer: boolean;
}): Promise<InvoiceOutcome> {
  const { data } = await apiClient.post<ApiEnvelope<InvoiceOutcome>>('/admin/invoices', input);
  return data.data;
}

/** Settles the whole invoice and activates its plan; the amount always comes from the invoice. */
export async function recordInvoicePayment(
  invoiceId: string,
  input: { method: PaymentMethod; reference?: string; notifyCustomer: boolean }
): Promise<InvoiceOutcome> {
  const { data } = await apiClient.post<ApiEnvelope<InvoiceOutcome>>(
    `/admin/invoices/${invoiceId}/payments`,
    input
  );
  return data.data;
}

export async function voidInvoice(invoiceId: string): Promise<InvoiceOutcome> {
  const { data } = await apiClient.post<ApiEnvelope<InvoiceOutcome>>(
    `/admin/invoices/${invoiceId}/void`
  );
  return data.data;
}
