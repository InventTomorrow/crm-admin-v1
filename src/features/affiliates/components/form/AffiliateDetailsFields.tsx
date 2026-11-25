import { Controller, type UseFormReturn } from 'react-hook-form';
import { LuUserCheck } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { AffiliateFormValues } from '../../affiliate-form.schema';
import { MAX_COMMISSION_PERCENT } from '../../types';

interface AffiliateDetailsFieldsProps {
  form: UseFormReturn<AffiliateFormValues>;
  isEditing: boolean;
  /** Set when the typed email already belongs to an account that was not picked. */
  existingAccountLabel?: string | null;
  onLinkExistingAccount?: () => void;
}

export function AffiliateDetailsFields({
  form,
  isEditing,
  existingAccountLabel,
  onLinkExistingAccount,
}: AffiliateDetailsFieldsProps) {
  const { errors } = form.formState;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Name" required error={errors.name?.message}>
          <Input invalid={!!errors.name} {...form.register('name')} />
        </Field>
        <Field label="Email" required error={errors.email?.message}>
          <Input
            type="email"
            invalid={!!errors.email || !!existingAccountLabel}
            {...form.register('email')}
          />
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
                max={MAX_COMMISSION_PERCENT}
                step={0.5}
                invalid={!!fieldState.error}
                value={Number.isNaN(field.value) ? '' : field.value}
                onChange={event => field.onChange(event.target.valueAsNumber)}
              />
            </Field>
          )}
        />
      </div>

      {existingAccountLabel && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5"
        >
          <div className="flex items-start gap-2 text-sm text-default-700">
            <LuUserCheck className="mt-0.5 size-4 shrink-0 text-warning" />
            <span>
              <span className="font-medium">{existingAccountLabel}</span> already has an account
              with this email. Link that account instead, or use a different email.
            </span>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={onLinkExistingAccount}>
            Link this account
          </Button>
        </div>
      )}

      {isEditing && (
        <Field label="Status" hint="Suspended affiliates' codes stop working for new sign-ups.">
          <Select {...form.register('status')}>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Suspended</option>
          </Select>
        </Field>
      )}

      <Field label="Notes" error={errors.notes?.message}>
        <Textarea rows={2} placeholder="Internal only" {...form.register('notes')} />
      </Field>
    </div>
  );
}
