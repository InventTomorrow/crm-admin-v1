import type { SearchSelectOption } from '@/components/ui/search-select';
import { formatFullName } from '@/lib/format';
import type { UserListItem } from '@/lib/types';

export type BillableUser = Pick<
  UserListItem,
  'id' | 'email' | 'originalEmail' | 'firstName' | 'lastName' | 'deletedAt'
>;

/** The account shape the Make payment dialog locks onto. */
export function toPaymentAccount(user: BillableUser): SearchSelectOption {
  const email = user.originalEmail ?? user.email;
  const fullName = formatFullName(user.firstName, user.lastName);
  return { id: user.id, label: fullName === 'N/A' ? email : fullName, sub: email };
}
