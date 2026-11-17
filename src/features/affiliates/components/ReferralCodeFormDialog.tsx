import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { ToggleRow } from '@/components/ui/switch';
import { referralCodeFormSchema, type ReferralCodeFormValues } from '../affiliate-form.schema';
import { useCreateReferralCode, useUpdateReferralCode } from '../affiliates.hooks';
import type { ReferralCode } from '../types';
import { DiscountPercentPicker } from './DiscountPercentPicker';

interface ReferralCodeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliateId: string;
  /** Omit to create a new code. */
  referralCode?: ReferralCode | null;
}

function codeFormDefaults(referralCode?: ReferralCode | null): ReferralCodeFormValues {
  return {
    code: referralCode?.code ?? '',
    discountPercent: referralCode?.discountPercent ?? 10,
    maxRedemptions: referralCode?.maxRedemptions ?? null,
    expiresAt: referralCode?.expiresAt ? new Date(referralCode.expiresAt) : null,
    isActive: referralCode?.isActive ?? true,
  };
}

export function ReferralCodeFormDialog({
  open,
  onOpenChange,
  affiliateId,
  referralCode,
}: ReferralCodeFormDialogProps) {
  const isEditing = Boolean(referralCode);
  const createCodeMutation = useCreateReferralCode(affiliateId);
  const updateCodeMutation = useUpdateReferralCode();
  const isSaving = createCodeMutation.isPending || updateCodeMutation.isPending;

  const form = useForm<ReferralCodeFormValues>({
    resolver: zodResolver(referralCodeFormSchema),
    defaultValues: codeFormDefaults(referralCode),
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (open) form.reset(codeFormDefaults(referralCode));
  }, [open, referralCode, form]);

  const onSubmit = (values: ReferralCodeFormValues) => {
    const limits = {
      discountPercent: values.discountPercent,
      maxRedemptions: values.maxRedemptions,
      expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null,
      isActive: values.isActive,
    };
    const closeOnSuccess = { onSuccess: () => onOpenChange(false) };
    if (referralCode) {
      updateCodeMutation.mutate({ codeId: referralCode.id, input: limits }, closeOnSuccess);
      return;
    }
    createCodeMutation.mutate(
      { ...limits, ...(values.code ? { code: values.code.toUpperCase() } : {}) },
      closeOnSuccess
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? `Edit ${referralCode?.code}` : 'New referral code'}
      size="sm"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        {!isEditing && (
          <Field
            label="Code"
            error={errors.code?.message}
            hint="Leave blank to generate one. Codes cannot be renamed later."
          >
            <Input
              placeholder="e.g. ALI10"
              className="font-mono uppercase"
              invalid={!!errors.code}
              {...form.register('code')}
            />
          </Field>
        )}

        <Controller
          control={form.control}
          name="discountPercent"
          render={({ field, fieldState }) => (
            <Field
              label="Customer discount"
              required
              error={fieldState.error?.message}
              hint={
                isEditing
                  ? 'Accounts that already signed up keep the discount they were promised.'
                  : undefined
              }
            >
              <DiscountPercentPicker
                value={field.value}
                onChange={field.onChange}
                invalid={!!fieldState.error}
              />
            </Field>
          )}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="maxRedemptions"
            render={({ field, fieldState }) => (
              <Field label="Usage limit" error={fieldState.error?.message} hint="Blank = unlimited">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Unlimited"
                  invalid={!!fieldState.error}
                  value={field.value ?? ''}
                  onChange={event =>
                    field.onChange(
                      Number.isNaN(event.target.valueAsNumber) ? null : event.target.valueAsNumber
                    )
                  }
                />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="expiresAt"
            render={({ field, fieldState }) => (
              <Field label="Expires on" error={fieldState.error?.message} hint="Blank = never">
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Never"
                  invalid={!!fieldState.error}
                />
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <ToggleRow
              label="Active"
              description="Paused codes are rejected at onboarding."
              checked={field.value}
              onChange={event => field.onChange(event.target.checked)}
            />
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={isSaving} disabled={isSaving}>
            {isEditing ? 'Save code' : 'Create code'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
