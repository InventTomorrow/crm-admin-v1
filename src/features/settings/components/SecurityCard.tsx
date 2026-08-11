import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LuLock } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { useChangePassword } from '@/features/auth/auth.hooks';
import { changePasswordSchema, type ChangePasswordFormValues } from '../types';

export function SecurityCard() {
  const changePasswordMutation = useChangePassword();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });
  const { errors } = form.formState;

  const onSubmit = (values: ChangePasswordFormValues) =>
    changePasswordMutation.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      { onSuccess: () => form.reset() }
    );

  return (
    <div className="card">
      <div className="card-header">
        <h6 className="card-title flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LuLock className="size-4" />
          </span>
          Change password
        </h6>
        <p className="mt-1 text-sm text-default-500">
          Other signed-in sessions are logged out after a password change.
        </p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="card-body space-y-4">
        <Field
          label="Current password"
          htmlFor="currentPassword"
          required
          error={errors.currentPassword?.message}
        >
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            placeholder="Enter current password"
            invalid={!!errors.currentPassword}
            {...form.register('currentPassword')}
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="New password"
            htmlFor="newPassword"
            required
            error={errors.newPassword?.message}
          >
            <PasswordInput
              id="newPassword"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              invalid={!!errors.newPassword}
              {...form.register('newPassword')}
            />
          </Field>
          <Field
            label="Confirm new password"
            htmlFor="confirmNewPassword"
            required
            error={errors.confirmNewPassword?.message}
          >
            <PasswordInput
              id="confirmNewPassword"
              autoComplete="new-password"
              placeholder="Re-enter new password"
              invalid={!!errors.confirmNewPassword}
              {...form.register('confirmNewPassword')}
            />
          </Field>
        </div>

        <Button type="submit" loading={changePasswordMutation.isPending}>
          {changePasswordMutation.isPending ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </div>
  );
}
