import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchSelect, type SearchSelectOption } from '@/components/ui/search-select';
import { formatFullName } from '@/lib/format';
import { useDebounce } from '@/lib/useDebounce';
import { listUsers } from '../users.api';

interface CrmUserSearchSelectProps {
  value: SearchSelectOption | null;
  onSelect: (option: SearchSelectOption | null) => void;
  /** Query only runs while the host dialog is open. */
  enabled?: boolean;
  placeholder?: string;
  invalid?: boolean;
  clearable?: boolean;
}

/** Server-searched CRM account picker — shared by the billing dialogs. */
export function CrmUserSearchSelect({
  value,
  onSelect,
  enabled = true,
  placeholder = 'Search a user…',
  invalid,
  clearable,
}: CrmUserSearchSelectProps) {
  const [userSearch, setUserSearch] = useState('');
  const debouncedUserSearch = useDebounce(userSearch, 300);

  const usersQuery = useQuery({
    queryKey: ['users-min', debouncedUserSearch],
    queryFn: () => listUsers({ page: 1, limit: 25, search: debouncedUserSearch, type: 'crm' }),
    enabled,
  });

  const options: SearchSelectOption[] = (usersQuery.data?.items ?? []).map(user => ({
    id: user.id,
    label:
      formatFullName(user.firstName, user.lastName) === '—'
        ? user.email
        : formatFullName(user.firstName, user.lastName),
    sub: user.email,
  }));

  return (
    <SearchSelect
      options={options}
      value={value}
      onSelect={onSelect}
      query={userSearch}
      onQueryChange={setUserSearch}
      isLoading={usersQuery.isLoading || usersQuery.isFetching}
      placeholder={placeholder}
      emptyMessage="No users found."
      invalid={invalid}
      clearable={clearable}
    />
  );
}
