import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import { downloadBlob } from '@/lib/download';
import type { NewsletterSubscriberSortField, Paged, SortOrder } from '@/lib/types';

export const SUBSCRIBER_STATUSES = ['SUBSCRIBED', 'UNSUBSCRIBED'] as const;
export type NewsletterSubscriberStatus = (typeof SUBSCRIBER_STATUSES)[number];

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: NewsletterSubscriberStatus;
  source: string;
  unsubscribedAt: string | null;
  createdAt: string;
}

export interface NewsletterStats {
  subscribed: number;
  unsubscribed: number;
}

export interface ListSubscribersParams {
  page: number;
  limit: number;
  status?: NewsletterSubscriberStatus;
  search?: string;
  sortBy?: NewsletterSubscriberSortField;
  sortOrder?: SortOrder;
}

export async function listSubscribers(
  params: ListSubscribersParams
): Promise<Paged<NewsletterSubscriber>> {
  const { data } = await apiClient.get<ApiEnvelope<NewsletterSubscriber[]>>('/admin/newsletter', {
    params,
  });
  return { items: data.data, meta: data.meta! };
}

export async function getNewsletterStats(): Promise<NewsletterStats> {
  const { data } = await apiClient.get<ApiEnvelope<NewsletterStats>>('/admin/newsletter/stats');
  return data.data;
}

export async function deleteSubscriber(id: string): Promise<void> {
  await apiClient.delete(`/admin/newsletter/${id}`);
}

/** Streams the server-rendered CSV (subscribed emails only) straight to a download. */
export async function downloadSubscribersCsv(fileName: string): Promise<void> {
  const { data } = await apiClient.get<Blob>('/admin/newsletter/export', {
    responseType: 'blob',
  });
  downloadBlob(data, fileName);
}
