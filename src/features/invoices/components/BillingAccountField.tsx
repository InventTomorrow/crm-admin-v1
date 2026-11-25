import { LuUser } from 'react-icons/lu';
import { Field } from '@/components/ui/field';
import type { SearchSelectOption } from '@/components/ui/search-select';
import { CrmUserSearchSelect } from '@/features/users/components/CrmUserSearchSelect';

interface BillingAccountFieldProps {
  /** Set when the dialog was opened from a user's row; the account is then read-only. */
  lockedAccount: SearchSelectOption | null;
  selectedAccount: SearchSelectOption | null;
  onSelectAccount: (account: SearchSelectOption | null) => void;
  isEnabled: boolean;
  errorMessage?: string;
}

export function BillingAccountField({
  lockedAccount,
  selectedAccount,
  onSelectAccount,
  isEnabled,
  errorMessage,
}: BillingAccountFieldProps) {
  if (lockedAccount) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-default-200 bg-default-50 px-3 py-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LuUser className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-default-800">{lockedAccount.label}</p>
          {lockedAccount.sub && (
            <p className="truncate text-xs text-default-500">{lockedAccount.sub}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Field label="CRM account owner" required error={errorMessage}>
      <CrmUserSearchSelect
        value={selectedAccount}
        onSelect={onSelectAccount}
        enabled={isEnabled}
        invalid={Boolean(errorMessage)}
      />
    </Field>
  );
}
