import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/features/auth/types';
import { Button } from '@/components/ui/button';

/** UI-only stub — no reset endpoint exists on the server yet. */
const ResetPasswordPage = () => {
  const navigate = useNavigate();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const { errors } = form.formState;

  const onSubmit = () => {
    toast.success('Password updated. Sign in with your new password.');
    navigate('/login', { replace: true });
  };

  return (
    <AuthShell
      metaTitle="Reset password"
      heading="Set a new password"
      subheading="Choose a strong password of at least 8 characters."
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-10 w-full text-start" noValidate>
        <Field
          label="New password"
          htmlFor="password"
          error={errors.password?.message}
          className="mb-4"
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Enter new password"
            invalid={!!errors.password}
            {...form.register('password')}
          />
        </Field>

        <Field
          label="Confirm password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
          className="mb-6"
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter new password"
            invalid={!!errors.confirmPassword}
            {...form.register('confirmPassword')}
          />
        </Field>

        <Button type="submit" className="w-full">
          Update password
        </Button>
      </form>
    </AuthShell>
  );
};

export default ResetPasswordPage;
