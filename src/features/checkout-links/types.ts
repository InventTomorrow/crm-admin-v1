import { z } from 'zod';

export const createCheckoutLinkSchema = z.object({
  planId: z.string().min(1, 'Pick a plan'),
  ownerUserId: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.union([z.literal(''), z.email('Enter a valid email address')]).optional(),
  customerPhone: z.string().optional(),
  expiresInDays: z.number().int().min(1, 'At least 1 day').max(90, 'At most 90 days'),
});
export type CreateCheckoutLinkFormValues = z.infer<typeof createCheckoutLinkSchema>;
