import { Controller, type UseFormReturn } from 'react-hook-form';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { AffiliateFormValues } from '../../affiliate-form.schema';
import { MAX_COMMISSION_PERCENT } from '../../types';

interface AffiliateDetailsFieldsProps {
  form: UseFormReturn<AffiliateFormValues>;
  isEditing: boolean;
}

export function AffiliateDetailsFields({ form, isEditing }: AffiliateDetailsFieldsProps) {
  const { errors } = form.formState;

  return (
    <div className="space-y-4">
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
    </div>
  );
}
