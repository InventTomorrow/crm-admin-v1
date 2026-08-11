import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LuLoaderCircle, LuPlus } from 'react-icons/lu';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { useCreateUser } from '../users.hooks';
import { createUserSchema, type CreateUserFormValues } from '../types';
import { Button } from '@/components/ui/button';

export function CreateUserDialog({ defaultSystem = false }: { defaultSystem?: boolean }) {
  const [open, setOpen] = useState(false);
  const createUserMutation = useCreateUser();

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: defaultSystem ? 'SYSTEM_ADMIN' : 'NONE',
    },
  });
  const { errors } = form.formState;

  const onSubmit = (values: CreateUserFormValues) =>
    createUserMutation.mutate(
      {
        email: values.email,
        password: values.password,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
        systemRole: values.role === 'NONE' ? undefined : values.role,
      },
      {
        onSuccess: () => {
          form.reset();
          setOpen(false);
        },
      }
    );

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <LuPlus className="size-4 me-1" />
        New user
      </Button>

      <Modal open={open} onOpenChange={setOpen} title="Create user" size="sm">
        <p className="mb-4 text-sm text-default-500">Accounts are created pre-verified.</p>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="First name" htmlFor="firstName">
              <Input id="firstName" placeholder="First name" {...form.register('firstName')} />
            </Field>
            <Field label="Last name" htmlFor="lastName">
              <Input id="lastName" placeholder="Last name" {...form.register('lastName')} />
            </Field>
          </div>

          <Field label="Email" htmlFor="newUserEmail" required error={errors.email?.message}>
            <Input
              id="newUserEmail"
              type="email"
              autoComplete="off"
              placeholder="Email"
              invalid={!!errors.email}
              {...form.register('email')}
            />
          </Field>

          <Field
            label="Password"
            htmlFor="newUserPassword"
            required
            error={errors.password?.message}
          >
            <PasswordInput
              id="newUserPassword"
              autoComplete="new-password"
              placeholder="Password"
              invalid={!!errors.password}
              {...form.register('password')}
            />
          </Field>

          <Field label="System role" htmlFor="newUserRole" error={errors.role?.message}>
            <Select id="newUserRole" {...form.register('role')}>
              <option value="NONE">None (CRM user)</option>
              <option value="SYSTEM_MANAGER">System Manager</option>
              <option value="SYSTEM_ADMIN">System Admin</option>
            </Select>
          </Field>

          <Button type="submit" className="mt-2 w-full" disabled={createUserMutation.isPending}>
            {createUserMutation.isPending && (
              <LuLoaderCircle className="size-4 me-1.5 animate-spin" />
            )}
            {createUserMutation.isPending ? 'Creating…' : 'Create'}
          </Button>
        </form>
      </Modal>
    </>
  );
}
