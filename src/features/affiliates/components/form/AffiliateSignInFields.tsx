import { Controller, type UseFormReturn } from 'react-hook-form';
import { Field } from '@/components/ui/field';
import type { SearchSelectOption } from '@/components/ui/search-select';
import { Select } from '@/components/ui/select';
import { ToggleRow } from '@/components/ui/switch';
import { CrmUserSearchSelect } from '@/features/users/components/CrmUserSearchSelect';
import { JOIN_OPTION_LABEL } from '../../affiliate-display';
import type { AffiliateFormValues, JoinOption } from '../../affiliate-form.schema';

interface AffiliateSignInFieldsProps {
  form: UseFormReturn<AffiliateFormValues>;
  isEditing: boolean;
  isOpen: boolean;
  selectedUser: SearchSelectOption | null;
  onUserSelected: (userOption: SearchSelectOption | null) => void;
}

export function AffiliateSignInFields({
  form,
  isEditing,
  isOpen,
  selectedUser,
  onUserSelected,
}: AffiliateSignInFieldsProps) {
  const joinOption = form.watch('joinOption');
  const sendsJoinLink = joinOption === 'SET_PASSWORD' || joinOption === 'SIGNUP';
  const showsAccountPicker = isEditing || joinOption === 'EXISTING_ACCOUNT';

  return (
    <div className="space-y-4">
      {!isEditing && (
        <Field
          label="How will they sign in?"
          hint="Their account needs no workspace. If their email already has a verified account, it is linked automatically."
        >
          <Select {...form.register('joinOption')}>
            {(Object.keys(JOIN_OPTION_LABEL) as JoinOption[]).map(option => (
              <option key={option} value={option}>
                {JOIN_OPTION_LABEL[option]}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {joinOption === 'SIGNUP' && !isEditing && (
        <p className="rounded-lg bg-default-150/60 px-3 py-2 text-sm text-default-600">
          They enter their first name, last name, WhatsApp number and password. Their email stays
          the one you enter in the next step.
        </p>
      )}

      {sendsJoinLink && !isEditing && (
        <Controller
          control={form.control}
          name="sendInviteEmail"
          render={({ field }) => (
            <ToggleRow
              label="Email the link to them"
              description="Turn off to only copy the link, for example to send it on WhatsApp."
              checked={field.value}
              onChange={event => field.onChange(event.target.checked)}
            />
          )}
        />
      )}

      {showsAccountPicker && (
        <Field
          label={isEditing ? 'Existing account (optional)' : 'Account to link'}
          required={!isEditing}
          error={form.formState.errors.userId?.message}
          hint="Link a current user so they can see their own referral stats in the app."
        >
          <CrmUserSearchSelect
            value={selectedUser}
            onSelect={onUserSelected}
            enabled={isOpen}
            placeholder="Not linked to an account"
            clearable
          />
        </Field>
      )}
    </div>
  );
}
