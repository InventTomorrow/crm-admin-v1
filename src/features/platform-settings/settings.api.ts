import { apiClient, type ApiEnvelope } from '@/lib/apiClient';

/** Shown on the public /subscribe/:token checkout page. */
export interface SupportContact {
  supportName: string | null;
  supportPhone: string | null;
  supportWhatsapp: string | null;
  supportEmail: string | null;
  paymentInstructions: string | null;
}

export async function getSupportContact(): Promise<SupportContact> {
  const { data } = await apiClient.get<ApiEnvelope<SupportContact>>(
    '/admin/settings/support-contact'
  );
  return data.data;
}

export async function updateSupportContact(input: SupportContact): Promise<SupportContact> {
  const { data } = await apiClient.put<ApiEnvelope<SupportContact>>(
    '/admin/settings/support-contact',
    input
  );
  return data.data;
}
