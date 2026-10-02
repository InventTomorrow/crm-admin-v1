import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Min 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['NONE', 'SYSTEM_ADMIN', 'SYSTEM_MANAGER']),
});
export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  firstName: z.string().trim().max(100, 'Max 100 characters'),
  lastName: z.string().trim().max(100, 'Max 100 characters'),
  phone: z.string().trim().max(30, 'Max 30 characters'),
  email: z.email('Enter a valid email address'),
});
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
