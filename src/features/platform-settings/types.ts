import { z } from 'zod';

export const supportContactSchema = z.object({
  supportName: z.string(),
  supportPhone: z.string(),
  supportWhatsapp: z.string(),
  supportEmail: z.union([z.literal(''), z.email('Enter a valid email address')]),
  paymentInstructions: z.string(),
});
export type SupportContactFormValues = z.infer<typeof supportContactSchema>;
