import type { InvoiceStatus } from '@/lib/types';

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  PAID: 'Paid',
  OPEN: 'Unpaid',
  DRAFT: 'Draft',
  VOID: 'Cancelled',
  UNCOLLECTIBLE: 'Uncollectible',
};
