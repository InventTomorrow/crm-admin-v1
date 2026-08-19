import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import type { Paged } from '@/lib/types';

export const CONTACT_MESSAGE_STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED'] as const;
export type ContactMessageStatus = (typeof CONTACT_MESSAGE_STATUSES)[number];

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  source: string;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ContactMessageStats {
  total: number;
  isNew: number;
  inProgress: number;
  resolved: number;
}

export async function listContactMessages(params: {
  page: number;
  limit: number;
  status?: ContactMessageStatus;
  search?: string;
}): Promise<Paged<ContactMessage>> {
  const { data } = await apiClient.get<ApiEnvelope<ContactMessage[]>>('/admin/contact-messages', {
    params,
  });
  return { items: data.data, meta: data.meta! };
}

export async function getContactMessageStats(): Promise<ContactMessageStats> {
  const { data } = await apiClient.get<ApiEnvelope<ContactMessageStats>>(
    '/admin/contact-messages/stats'
  );
  return data.data;
}

export async function updateContactMessageStatus(input: {
  id: string;
  status: ContactMessageStatus;
}): Promise<ContactMessage> {
  const { data } = await apiClient.patch<ApiEnvelope<ContactMessage>>(
    `/admin/contact-messages/${input.id}/status`,
    { status: input.status }
  );
  return data.data;
}

export async function deleteContactMessage(id: string): Promise<void> {
  await apiClient.delete(`/admin/contact-messages/${id}`);
}
