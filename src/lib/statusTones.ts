import type { BadgeTone } from '@/components/ui/badge';
import type { InvoiceStatus, SubscriptionStatus, TenantStatus } from '@/lib/types';

export const TENANT_STATUS_TONE: Record<TenantStatus, BadgeTone> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  CHURNED: 'danger',
};

export const SUBSCRIPTION_STATUS_TONE: Record<SubscriptionStatus, BadgeTone> = {
  ACTIVE: 'success',
  PENDING: 'neutral',
  TRIALING: 'info',
  PAST_DUE: 'warning',
  CANCELLED: 'danger',
};

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, BadgeTone> = {
  PAID: 'success',
  OPEN: 'warning',
  DRAFT: 'neutral',
  VOID: 'neutral',
  UNCOLLECTIBLE: 'danger',
};
