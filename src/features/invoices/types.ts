import { z } from 'zod';
import { PAYMENT_METHODS } from '@/features/subscriptions/subscriptions.api';

export const DUE_IN_DAY_OPTIONS = [0, 3, 7, 15, 30] as const;

export const createInvoiceSchema = z.object({
  ownerUserId: z.string().min(1, 'Pick a CRM account'),
  planId: z.string().min(1, 'Pick a plan'),
  // Plan periods sold in one invoice: 2 on a monthly plan bills two months.
  periodCount: z.number().int().min(1, 'At least 1').max(60, 'At most 60'),
  amount: z.number({ error: 'Enter an amount' }).min(0, 'Must be 0 or more'),
  // Only meaningful below the quoted total; the server enforces the same rule.
  discountReason: z.string().trim().max(200).optional(),
  dueInDays: z.number().int().min(0).max(90),
  notifyCustomer: z.boolean(),
});
export type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>;

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Pick the invoice being paid'),
  method: z.enum(PAYMENT_METHODS),
  reference: z.string().trim().max(120).optional(),
  notifyCustomer: z.boolean(),
});
export type RecordPaymentFormValues = z.infer<typeof recordPaymentSchema>;
