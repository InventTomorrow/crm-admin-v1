import { apiClient, type ApiEnvelope } from '@/lib/apiClient';

export type AdminNotificationType =
  | 'SUBSCRIPTION_REQUEST'
  | 'TENANT_CREATED'
  | 'USER_REGISTERED'
  | 'SUBSCRIPTION_PAST_DUE';

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  title: string;
  body: string;
  href: string;
  createdAt: string;
}

export async function listNotifications(limit = 20): Promise<AdminNotification[]> {
  const { data } = await apiClient.get<ApiEnvelope<AdminNotification[]>>('/admin/notifications', {
    params: { limit },
  });
  return data.data;
}
