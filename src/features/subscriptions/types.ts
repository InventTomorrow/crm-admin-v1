import { z } from 'zod';
import { PAYMENT_METHODS } from './subscriptions.api';

export const createSubscriptionSchema = z.object({
  ownerUserId: z.string().min(1, 'Pick a CRM account'),
  planId: z.string().min(1, 'Pick a plan'),
  // Plan periods bought in one go — 2 on a monthly plan grants two months.
  periodCount: z.number().int().min(1, 'At least 1').max(60, 'At most 60'),
  method: z.enum(PAYMENT_METHODS),
  amount: z.number().min(0, 'Must be 0 or more'),
  reference: z.string().optional(),
  // Only meaningful below the plan's price. The server enforces the same rule —
  // this field just spares the admin a round-trip to be told so.
  discountReason: z.string().trim().max(200).optional(),
});
export type CreateSubscriptionFormValues = z.infer<typeof createSubscriptionSchema>;
