import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import type { PaymentAccount, PaymentAccountInput } from './types';

export async function listPaymentAccounts(): Promise<PaymentAccount[]> {
  const { data } = await apiClient.get<ApiEnvelope<PaymentAccount[]>>('/admin/payment-accounts');
  return data.data;
}

export async function createPaymentAccount(input: PaymentAccountInput): Promise<PaymentAccount> {
  const { data } = await apiClient.post<ApiEnvelope<PaymentAccount>>(
    '/admin/payment-accounts',
    input
  );
  return data.data;
}

export async function updatePaymentAccount(
  id: string,
  input: Partial<PaymentAccountInput>
): Promise<PaymentAccount> {
  const { data } = await apiClient.patch<ApiEnvelope<PaymentAccount>>(
    `/admin/payment-accounts/${id}`,
    input
  );
  return data.data;
}

/** Takes every account id in the order they should appear on checkout. */
export async function reorderPaymentAccounts(ids: string[]): Promise<PaymentAccount[]> {
  const { data } = await apiClient.patch<ApiEnvelope<PaymentAccount[]>>(
    '/admin/payment-accounts/reorder',
    { ids }
  );
  return data.data;
}

export async function deletePaymentAccount(id: string): Promise<void> {
  await apiClient.delete(`/admin/payment-accounts/${id}`);
}
