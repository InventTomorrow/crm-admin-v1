import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import type { ActiveOffer, CreatePromoOfferInput, PromoOffer } from './types';

export async function listPromoOffers(): Promise<PromoOffer[]> {
  const { data } = await apiClient.get<ApiEnvelope<PromoOffer[]>>('/admin/promo-offers');
  return data.data;
}

export async function getActivePromoOffer(): Promise<ActiveOffer | null> {
  const { data } = await apiClient.get<ApiEnvelope<ActiveOffer | null>>(
    '/admin/promo-offers/active'
  );
  return data.data;
}

export async function createPromoOffer(input: CreatePromoOfferInput): Promise<PromoOffer> {
  const { data } = await apiClient.post<ApiEnvelope<PromoOffer>>('/admin/promo-offers', input);
  return data.data;
}

export async function endPromoOffer(id: string): Promise<PromoOffer> {
  const { data } = await apiClient.patch<ApiEnvelope<PromoOffer>>(
    `/admin/promo-offers/${id}/end`
  );
  return data.data;
}
