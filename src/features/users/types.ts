import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Min 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['NONE', 'SYSTEM_ADMIN', 'SYSTEM_MANAGER']),
});
export type CreateUserFormValues = z.infer<typeof createUserSchema>;
