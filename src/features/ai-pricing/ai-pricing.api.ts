import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import type { AiModelPricing, ModelCostBreakdown } from '@/lib/types';

export interface AddModelPricingInput {
  provider: string;
  model: string;
  inputPricePerMillionTokens: number;
  cachedInputPricePerMillionTokens: number | null;
  outputPricePerMillionTokens: number;
  currency: string;
}

export interface CalculateCostItem {
  provider: string;
  model: string;
  promptTokens: number;
  cachedTokens: number;
  completionTokens: number;
}

export async function listCurrentPricing(): Promise<AiModelPricing[]> {
  const { data } = await apiClient.get<ApiEnvelope<AiModelPricing[]>>('/admin/ai-pricing');
  return data.data;
}

export async function addModelPricing(input: AddModelPricingInput): Promise<AiModelPricing> {
  const { data } = await apiClient.post<ApiEnvelope<AiModelPricing>>('/admin/ai-pricing', input);
  return data.data;
}

export async function calculateHypotheticalCost(
  items: CalculateCostItem[]
): Promise<ModelCostBreakdown[]> {
  const { data } = await apiClient.post<ApiEnvelope<ModelCostBreakdown[]>>(
    '/admin/ai-pricing/calculate',
    { items }
  );
  return data.data;
}

export async function getExchangeRate(): Promise<number | null> {
  const { data } = await apiClient.get<ApiEnvelope<{ usdToPkrRate: number | null }>>(
    '/admin/settings/exchange-rate'
  );
  return data.data.usdToPkrRate;
}

export async function updateExchangeRate(usdToPkrRate: number): Promise<number | null> {
  const { data } = await apiClient.put<ApiEnvelope<{ usdToPkrRate: number | null }>>(
    '/admin/settings/exchange-rate',
    { usdToPkrRate }
  );
  return data.data.usdToPkrRate;
}
