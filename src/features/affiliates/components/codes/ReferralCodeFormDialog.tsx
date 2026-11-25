import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { ToggleRow } from '@/components/ui/switch';
import {
  referralCodeFormSchema,
  toReferralCodeInput,
  type ReferralCodeFormValues,
} from '../../affiliate-form.schema';
import type { ReferralCodeInput } from '../../affiliates.api';
import { DiscountPercentPicker } from '../shared/DiscountPercentPicker';

interface ReferralCodeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel: string;
  /** Memoize it: the form resets to these values each time the dialog opens. */
  initialValues: ReferralCodeFormValues;
  /** A saved code can't be renamed, and a new discount only applies to later sign-ups. */
  isSavedCode?: boolean;
  isSaving?: boolean;
  onSave: (codeInput: ReferralCodeInput) => void;
}

/** One form for every code: saved straight away on the affiliate page, or kept as a draft while adding an affiliate. */
export function ReferralCodeFormDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  initialValues,
  isSavedCode = false,
  isSaving = false,
  onSave,
}: ReferralCodeFormDialogProps) {
  const form = useForm<ReferralCodeFormValues>({
    resolver: zodResolver(referralCodeFormSchema),
    defaultValues: initialValues,
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (open) form.reset(initialValues);
  }, [open, initialValues, form]);

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} size="sm">
      <form
        onSubmit={event => {
          // Stops the submit reaching the affiliate form this dialog can open from.
          event.stopPropagation();
          void form.handleSubmit(values => onSave(toReferralCodeInput(values)))(event);
        }}
        noValidate
        className="space-y-4"
      >
        {!isSavedCode && (
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
                isSavedCode
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
              <Field
                label="Usage limit"
                error={fieldState.error?.message}
                hint="How many accounts can sign up with it. Blank = no limit."
              >
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
              <Field
                label="Expires on"
                error={fieldState.error?.message}
                hint="New sign-ups can't use it after this date. Blank = never."
              >
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
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
