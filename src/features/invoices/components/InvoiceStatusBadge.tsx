import { Badge } from '@/components/ui/badge';
import { INVOICE_STATUS_TONE } from '@/lib/statusTones';
import type { InvoiceStatus } from '@/lib/types';
import { INVOICE_STATUS_LABEL } from '../invoice-status';

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge tone={INVOICE_STATUS_TONE[status]}>{INVOICE_STATUS_LABEL[status]}</Badge>;
}
