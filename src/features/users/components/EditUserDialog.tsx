import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LuLoaderCircle } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import type { UserListItem } from '@/lib/types';
import { updateUserSchema, type UpdateUserFormValues } from '../types';
import { useUpdateUser } from '../users.hooks';

type EditableUser = Pick<UserListItem, 'id' | 'email' | 'firstName' | 'lastName' | 'phone'>;

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: EditableUser;
}

export function EditUserDialog({ open, onOpenChange, user }: EditUserDialogProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Edit user" size="sm">
      <EditUserForm user={user} onSaved={() => onOpenChange(false)} />
    </Modal>
  );
}

function EditUserForm({ user, onSaved }: { user: EditableUser; onSaved: () => void }) {
  const updateUserMutation = useUpdateUser();

  const form = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phone: user.phone ?? '',
      email: user.email,
    },
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = (values: UpdateUserFormValues) =>
    updateUserMutation.mutate({ id: user.id, input: values }, { onSuccess: onSaved });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="First name" htmlFor="editUserFirstName" error={errors.firstName?.message}>
          <Input
            id="editUserFirstName"
            placeholder="First name"
            invalid={!!errors.firstName}
            {...form.register('firstName')}
          />
        </Field>
        <Field label="Last name" htmlFor="editUserLastName" error={errors.lastName?.message}>
          <Input
            id="editUserLastName"
            placeholder="Last name"
            invalid={!!errors.lastName}
            {...form.register('lastName')}
          />
        </Field>
      </div>

      <Field label="Email" htmlFor="editUserEmail" required error={errors.email?.message}>
        <Input
          id="editUserEmail"
          type="email"
          autoComplete="off"
          placeholder="Email"
          invalid={!!errors.email}
          {...form.register('email')}
        />
      </Field>
      <p className="-mt-2 text-xs text-default-500">
        Changing the email changes where they sign in and where password resets are sent.
      </p>

      <Field label="Phone" htmlFor="editUserPhone" error={errors.phone?.message}>
        <Input
          id="editUserPhone"
          type="tel"
          placeholder="Phone"
          invalid={!!errors.phone}
          {...form.register('phone')}
        />
      </Field>

      <Button
        type="submit"
        className="mt-2 w-full"
        disabled={!isDirty || updateUserMutation.isPending}
      >
        {updateUserMutation.isPending && <LuLoaderCircle className="size-4 me-1.5 animate-spin" />}
        {updateUserMutation.isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}
