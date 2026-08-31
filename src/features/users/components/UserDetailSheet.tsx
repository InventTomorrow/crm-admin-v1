import { Sheet } from '@/components/ui/sheet';
import { formatFullName } from '@/lib/format';
import type { UserListItem } from '@/lib/types';
import { UserDetailPanel } from './UserDetailPanel';

interface UserDetailSheetProps {
  user: UserListItem | null;
  open: boolean;
  onClose: () => void;
}

/** Slide-over with the full user profile, roles and memberships. */
export function UserDetailSheet({ user, open, onClose }: UserDetailSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={isOpen => !isOpen && onClose()}
      title={user ? formatFullName(user.firstName, user.lastName) : ''}
      description={user ? (user.originalEmail ?? user.email) : ''}
      size="xl"
    >
      {user && <UserDetailPanel userId={user.id} />}
    </Sheet>
  );
}
