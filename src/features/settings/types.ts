import { z } from 'zod';

export const profileSchema = z.object({
  firstName: z.string().trim().max(60, 'Keep it under 60 characters'),
  lastName: z.string().trim().max(60, 'Keep it under 60 characters'),
  phone: z.string().trim().max(30, 'Keep it under 30 characters'),
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirmNewPassword: z.string(),
  })
  .refine(values => values.newPassword === values.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
