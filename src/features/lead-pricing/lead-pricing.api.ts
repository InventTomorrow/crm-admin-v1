import { z } from 'zod';
import { apiClient, type ApiEnvelope } from '@/lib/apiClient';

// Missing fields default rather than leaking undefined into forms (e.g. a server on an older build).
const leadPricingRatesResponseSchema = z.object({
  pricePerLead: z.number().default(0),
  messagesPerLead: z.number().default(0),
  baseFee: z.number().default(0),
  // Whole percent off the period total; monthly billing is never discounted.
  quarterlyDiscountPercent: z.number().default(0),
  semiAnnualDiscountPercent: z.number().default(0),
  annualDiscountPercent: z.number().default(0),
  currency: z.string().default('PKR'),
});

export type LeadPricingRates = z.infer<typeof leadPricingRatesResponseSchema>;
export type LeadPricingRatesInput = Omit<LeadPricingRates, 'currency'>;

export async function getLeadPricingRates(): Promise<LeadPricingRates> {
  const { data } = await apiClient.get<ApiEnvelope<unknown>>('/admin/plans/lead-pricing');
  return leadPricingRatesResponseSchema.parse(data.data);
}

export async function updateLeadPricingRates(
  input: LeadPricingRatesInput
): Promise<LeadPricingRates> {
  const { data } = await apiClient.put<ApiEnvelope<unknown>>('/admin/plans/lead-pricing', input);
  return leadPricingRatesResponseSchema.parse(data.data);
}
