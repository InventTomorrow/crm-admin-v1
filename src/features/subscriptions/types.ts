import { z } from 'zod';
import { PAYMENT_METHODS } from './subscriptions.api';

export const createSubscriptionSchema = z.object({
  ownerUserId: z.string().min(1, 'Pick a CRM account'),
  planId: z.string().min(1, 'Pick a plan'),
  method: z.enum(PAYMENT_METHODS),
  amount: z.number().min(0, 'Must be 0 or more'),
  reference: z.string().optional(),
});
export type CreateSubscriptionFormValues = z.infer<typeof createSubscriptionSchema>;
