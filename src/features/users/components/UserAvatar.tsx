import { cn } from '@/lib/utils';

interface UserAvatarProps {
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
  /** Paid accounts get the gradient ring; trials and free accounts don't. */
  hasPaidPlan?: boolean;
  /** Tailwind size class for the avatar itself, e.g. `size-10`. */
  className?: string;
}

function initialsOf(firstName: string | null, lastName: string | null, email: string): string {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  return initials || email[0]?.toUpperCase() || '?';
}

/** Avatar or initials fallback, ringed when the account is on a paid plan. */
export function UserAvatar({
  firstName,
  lastName,
  email,
  avatarUrl,
  hasPaidPlan = false,
  className = 'size-10',
}: UserAvatarProps) {
  const avatar = avatarUrl ? (
    <img
      src={avatarUrl}
      alt=""
      className={cn('shrink-0 rounded-full object-cover', className)}
      loading="lazy"
    />
  ) : (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-default-200 font-semibold text-default-700',
        className
      )}
    >
      {initialsOf(firstName, lastName, email)}
    </span>
  );

  if (!hasPaidPlan) return avatar;

  return (
    <span className="avatar-plan-ring inline-flex shrink-0" title="On a paid plan">
      {avatar}
    </span>
  );
}
