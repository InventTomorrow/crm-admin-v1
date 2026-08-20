import { Link } from 'react-router';
import { LuUserPlus } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/features/users/components/UserAvatar';
import { formatFullName, formatRelative } from '@/lib/format';
import { isOnPaidPlan, planLabel, planTone } from '@/lib/plan';
import type { Metrics } from '@/lib/types';

/** Latest signups — a snapshot, so it stays useful whatever range is selected. */
export function RecentUsersWidget({ users }: { users: Metrics['recentUsers'] }) {
  if (users.length === 0) {
    return (
      <p className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-default-500">
        <LuUserPlus className="size-5 text-default-400" />
        No users have signed up yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-default-200">
      {users.map(user => (
        <li key={user.id}>
          <Link
            to="/users"
            className="flex items-center gap-3 px-1 py-3 transition-colors hover:bg-primary/5"
          >
            <UserAvatar
              firstName={user.firstName}
              lastName={user.lastName}
              email={user.email}
              avatarUrl={user.avatarUrl}
              hasPaidPlan={isOnPaidPlan(user.activeSubscription)}
              className="size-9 text-sm"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-default-800">
                {formatFullName(user.firstName, user.lastName)}
              </span>
              <span className="block truncate text-xs text-default-500">{user.email}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1">
              <Badge tone={planTone(user.activeSubscription)}>
                {planLabel(user.activeSubscription)}
              </Badge>
              <span className="text-xs text-default-400">{formatRelative(user.createdAt)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
