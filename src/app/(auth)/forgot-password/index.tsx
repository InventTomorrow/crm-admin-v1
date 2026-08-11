import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { LuMailCheck } from 'react-icons/lu';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/features/auth/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** UI-only stub — no reset endpoint exists on the server yet. */
const ForgotPasswordPage = () => {
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });
  const { errors } = form.formState;

  return (
    <AuthShell
      metaTitle="Forgot password"
      heading="Forgot your password?"
      subheading="Enter your email and we'll send you reset instructions."
    >
      {emailSent ? (
        <div className="mt-10 space-y-4 text-center">
          <LuMailCheck className="mx-auto size-10 text-success" />
          <p className="text-sm text-default-500">
            If an account exists for that email, reset instructions are on their way. Check your
            inbox.
          </p>
          <Link to="/login" className={cn(buttonVariants(), 'w-full')}>
            Back to sign in
          </Link>
        </div>
      ) : (
        <form
          onSubmit={form.handleSubmit(() => setEmailSent(true))}
          className="mt-10 w-full text-start"
          noValidate
        >
          <Field label="Email" htmlFor="email" error={errors.email?.message} className="mb-6">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              invalid={!!errors.email}
              {...form.register('email')}
            />
          </Field>

          <Button type="submit" className="w-full">
            Send reset link
          </Button>

          <p className="mt-6 text-center text-sm text-default-500">
            Remembered it?{' '}
            <Link to="/login" className="font-semibold text-primary">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
};

export default ForgotPasswordPage;
