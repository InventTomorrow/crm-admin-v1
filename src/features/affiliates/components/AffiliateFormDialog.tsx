import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import type { SearchSelectOption } from '@/components/ui/search-select';
import { Select } from '@/components/ui/select';
import { ToggleRow } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { CrmUserSearchSelect } from '@/features/users/components/CrmUserSearchSelect';
import { formatFullName } from '@/lib/format';
import {
  affiliateFormDefaults,
  affiliateFormSchema,
  type AffiliateFormValues,
} from '../affiliate-form.schema';
import { useCreateAffiliate, useUpdateAffiliate } from '../affiliates.hooks';
import type { AffiliateInput } from '../affiliates.api';
import type { Affiliate } from '../types';
import { DiscountPercentPicker } from './DiscountPercentPicker';

interface AffiliateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Omit to create a new affiliate. */
  affiliate?: Affiliate | null;
  onCreated?: (affiliate: Affiliate) => void;
}

function linkedUserOption(affiliate?: Affiliate | null): SearchSelectOption | null {
  if (!affiliate?.user) return null;
  const fullName = formatFullName(affiliate.user.firstName, affiliate.user.lastName);
  return {
    id: affiliate.user.id,
    label: fullName === 'N/A' ? affiliate.user.email : fullName,
    sub: affiliate.user.email,
  };
}

function toAffiliateInput(values: AffiliateFormValues): AffiliateInput {
  return {
    userId: values.userId || null,
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || null,
    commissionPercent: values.commissionPercent,
    status: values.status,
    notes: values.notes.trim() || null,
  };
}

export function AffiliateFormDialog({
  open,
  onOpenChange,
  affiliate,
  onCreated,
}: AffiliateFormDialogProps) {
  const isEditing = Boolean(affiliate);
  const [selectedUser, setSelectedUser] = useState<SearchSelectOption | null>(null);
  const createAffiliateMutation = useCreateAffiliate();
  const updateAffiliateMutation = useUpdateAffiliate(affiliate?.id ?? '');
  const isSaving = createAffiliateMutation.isPending || updateAffiliateMutation.isPending;

  const form = useForm<AffiliateFormValues>({
    resolver: zodResolver(affiliateFormSchema),
    defaultValues: affiliateFormDefaults(affiliate),
  });
  const { errors } = form.formState;
  const createFirstCode = form.watch('createFirstCode');

  useEffect(() => {
    if (!open) return;
    form.reset(affiliateFormDefaults(affiliate));
    setSelectedUser(linkedUserOption(affiliate));
  }, [open, affiliate, form]);

  // Picking an existing account fills the contact fields, without overwriting typed values.
  const onUserSelected = (userOption: SearchSelectOption | null) => {
    setSelectedUser(userOption);
    form.setValue('userId', userOption?.id ?? '');
    if (!userOption) return;
    if (!form.getValues('name').trim() && userOption.label !== userOption.sub) {
      form.setValue('name', userOption.label, { shouldValidate: true });
    }
    if (!form.getValues('email').trim() && userOption.sub) {
      form.setValue('email', userOption.sub, { shouldValidate: true });
    }
  };

  const onSubmit = (values: AffiliateFormValues) => {
    const affiliateInput = toAffiliateInput(values);
    if (affiliate) {
      updateAffiliateMutation.mutate(affiliateInput, { onSuccess: () => onOpenChange(false) });
      return;
    }
    createAffiliateMutation.mutate(
      {
        affiliate: affiliateInput,
        firstCode: values.createFirstCode
          ? {
              discountPercent: values.firstCodeDiscountPercent,
              ...(values.firstCode ? { code: values.firstCode.toUpperCase() } : {}),
            }
          : null,
      },
      {
        onSuccess: createdAffiliate => {
          onOpenChange(false);
          onCreated?.(createdAffiliate);
        },
      }
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit affiliate' : 'Add an affiliate'}
      size="lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field
          label="Existing account (optional)"
          hint="Link a current user so they can see their own referral stats in the app."
        >
          <CrmUserSearchSelect
            value={selectedUser}
            onSelect={onUserSelected}
            enabled={open}
            placeholder="Not linked to an account"
            clearable
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Name" required error={errors.name?.message}>
            <Input invalid={!!errors.name} {...form.register('name')} />
          </Field>
          <Field label="Email" required error={errors.email?.message}>
            <Input type="email" invalid={!!errors.email} {...form.register('email')} />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <Input placeholder="Optional" {...form.register('phone')} />
          </Field>
          <Controller
            control={form.control}
            name="commissionPercent"
            render={({ field, fieldState }) => (
              <Field
                label="Commission %"
                required
                error={fieldState.error?.message}
                hint="Earned on the first payment of each referred account."
              >
                <Input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  invalid={!!fieldState.error}
                  value={Number.isNaN(field.value) ? '' : field.value}
                  onChange={event => field.onChange(event.target.valueAsNumber)}
                />
              </Field>
            )}
          />
        </div>

        {isEditing && (
          <Field label="Status" hint="Paused affiliates' codes stop working for new sign-ups.">
            <Select {...form.register('status')}>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
            </Select>
          </Field>
        )}

        <Field label="Notes" error={errors.notes?.message}>
          <Textarea rows={2} placeholder="Internal only" {...form.register('notes')} />
        </Field>

        {!isEditing && (
          <div className="space-y-3 rounded-lg border border-dashed border-default-300 p-3">
            <Controller
              control={form.control}
              name="createFirstCode"
              render={({ field }) => (
                <ToggleRow
                  label="Create a referral code now"
                  description="You can add more codes later from the affiliate page."
                  checked={field.value}
                  onChange={event => field.onChange(event.target.checked)}
                />
              )}
            />
            {createFirstCode && (
              <>
                <Controller
                  control={form.control}
                  name="firstCodeDiscountPercent"
                  render={({ field, fieldState }) => (
                    <Field label="Customer discount" error={fieldState.error?.message}>
                      <DiscountPercentPicker
                        value={field.value}
                        onChange={field.onChange}
                        invalid={!!fieldState.error}
                      />
                    </Field>
                  )}
                />
                <Field
                  label="Code"
                  error={errors.firstCode?.message}
                  hint="Leave blank to generate one from the affiliate's name."
                >
                  <Input
                    placeholder="e.g. ALI10"
                    className="font-mono uppercase"
                    invalid={!!errors.firstCode}
                    {...form.register('firstCode')}
                  />
                </Field>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={isSaving} disabled={isSaving}>
            {isEditing ? 'Save changes' : 'Add affiliate'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
