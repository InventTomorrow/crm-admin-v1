import { z } from 'zod';
import { LEAD_PRICED_DURATIONS, MAX_LEAD_PLAN_DISCOUNT_PERCENT } from './lead-pricing.util';

const discountPercent = () =>
  z
    .number({ message: 'Enter a percent, or 0 for none' })
    .int('Whole percent only')
    .min(0, 'Cannot be negative')
    .max(MAX_LEAD_PLAN_DISCOUNT_PERCENT, `At most ${MAX_LEAD_PLAN_DISCOUNT_PERCENT}%`);

/** Mirrors the server's leadPricingSchema (admin/settings/platform-settings.dto.ts). */
export const leadPricingRatesSchema = z.object({
  pricePerLead: z.number().positive('Must be above 0').max(100_000),
  messagesPerLead: z.number().int('Whole number only').min(1, 'At least 1').max(1000),
  baseFee: z.number().min(0, 'Cannot be negative').max(10_000_000),
  quarterlyDiscountPercent: discountPercent(),
  semiAnnualDiscountPercent: discountPercent(),
  annualDiscountPercent: discountPercent(),
});
export type LeadPricingRatesFormValues = z.infer<typeof leadPricingRatesSchema>;

/** Calculator inputs: the saved rates are the starting point, editable for what-if checks. */
export const leadPricingCalculatorSchema = leadPricingRatesSchema.extend({
  monthlyLeads: z.number().int('Whole number only').min(1, 'At least 1 lead'),
  duration: z.enum(LEAD_PRICED_DURATIONS),
});
export type LeadPricingCalculatorFormValues = z.infer<typeof leadPricingCalculatorSchema>;
