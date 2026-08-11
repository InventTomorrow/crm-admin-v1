import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LuShieldCheck, LuUser } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useMe, useUpdateProfile } from '@/features/auth/auth.hooks';
import { formatFullName } from '@/lib/format';
import { profileSchema, type ProfileFormValues } from '../types';
import { SettingsCard } from './SettingsCard';

export function ProfileCard() {
  const { data: signedInAdmin } = useMe();
  const updateProfileMutation = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: '', lastName: '', phone: '' },
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (signedInAdmin) {
      form.reset({
        firstName: signedInAdmin.firstName ?? '',
        lastName: signedInAdmin.lastName ?? '',
        phone: signedInAdmin.phone ?? '',
      });
    }
  }, [signedInAdmin, form]);

  const initials = (
    signedInAdmin?.firstName?.[0] ??
    signedInAdmin?.email?.[0] ??
    'A'
  ).toUpperCase();

  return (
    <SettingsCard
      icon={LuUser}
      title="Profile"
      description="Your admin account details, shown across the portal."
    >
      <div className="mb-5 flex items-center gap-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary text-base font-semibold text-white">
          {initials}
        </span>
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium text-default-800">
            {formatFullName(signedInAdmin?.firstName ?? null, signedInAdmin?.lastName ?? null)}
          </p>
          <p className="truncate text-sm text-default-500">{signedInAdmin?.email}</p>
        </div>
        <span className="ms-auto flex items-center gap-2">
          <LuShieldCheck className="size-4 text-default-500" />
          <Badge tone="primary">{signedInAdmin?.systemRole}</Badge>
        </span>
      </div>

      <form
        onSubmit={form.handleSubmit(values => updateProfileMutation.mutate(values))}
        noValidate
        className="space-y-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="First name" error={errors.firstName?.message}>
            <Input
              placeholder="First name"
              invalid={!!errors.firstName}
              {...form.register('firstName')}
            />
          </Field>
          <Field label="Last name" error={errors.lastName?.message}>
            <Input
              placeholder="Last name"
              invalid={!!errors.lastName}
              {...form.register('lastName')}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Email" hint="Contact a system admin to change your sign-in email.">
            <Input value={signedInAdmin?.email ?? ''} readOnly />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <Input
              placeholder="+92 300 0000000"
              invalid={!!errors.phone}
              {...form.register('phone')}
            />
          </Field>
        </div>

        <Button type="submit" loading={updateProfileMutation.isPending}>
          {updateProfileMutation.isPending ? 'Saving…' : 'Save profile'}
        </Button>
      </form>
    </SettingsCard>
  );
}
