import type { BadgeTone } from '@/components/ui/badge';
import type { SubscriptionStatus, TenantStatus } from '@/lib/types';

export const TENANT_STATUS_TONE: Record<TenantStatus, BadgeTone> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  CHURNED: 'danger',
};

export const SUBSCRIPTION_STATUS_TONE: Record<SubscriptionStatus, BadgeTone> = {
  ACTIVE: 'success',
  TRIALING: 'info',
  PAST_DUE: 'warning',
  CANCELLED: 'danger',
};
