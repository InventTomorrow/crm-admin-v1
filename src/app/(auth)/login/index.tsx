import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router';
import { LuLoaderCircle } from 'react-icons/lu';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { FullPageSpinner } from '@/components/states';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { useLogin, useMe } from '@/features/auth/auth.hooks';
import { loginSchema, type LoginFormValues } from '@/features/auth/types';
import { apiMessage } from '@/lib/apiClient';
import { appName } from '@/helpers/constants';
import { Button } from '@/components/ui/button';

const LoginPage = () => {
  const navigate = useNavigate();
  const { data: signedInAdmin, isLoading: isSessionLoading } = useMe();
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors } = form.formState;

  if (isSessionLoading) return <FullPageSpinner />;
  if (signedInAdmin) return <Navigate to="/" replace />;

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onSuccess: () => navigate('/', { replace: true }),
    });
  };

  return (
    <AuthShell
      metaTitle="Sign in"
      heading="Welcome back!"
      subheading={`Sign in to continue to ${appName}.`}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-10 w-full text-start" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message} className="mb-4">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            invalid={!!errors.email}
            {...form.register('email')}
          />
        </Field>

        <div className="mb-4">
          <Link to="/forgot-password" className="float-end mb-2 text-sm font-medium text-primary">
            Forgot password?
          </Link>
          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              invalid={!!errors.password}
              {...form.register('password')}
            />
          </Field>
        </div>

        {loginMutation.isError && (
          <p className="mb-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {apiMessage(loginMutation.error)}
          </p>
        )}

        <div className="mt-8 text-center">
          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending && <LuLoaderCircle className="size-4 me-1.5 animate-spin" />}
            {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
