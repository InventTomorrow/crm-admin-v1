import type { ReactNode } from 'react';
import { usePermissions } from '@/features/auth/auth.hooks';
import type { SystemPermission } from '@/lib/permissions';

interface PermissionGuardProps {
  /** Required permission, or several when any one of them is enough. */
  permission: SystemPermission | SystemPermission[];
  /** Require every listed permission instead of any one of them. */
  requireAll?: boolean;
  children: ReactNode;
  /** Rendered in place of the children when the permission is missing. */
  fallback?: ReactNode;
}

/**
 * Renders `children` only when the signed-in admin holds the permission. Use it
 * to hide mutating actions — create/edit/delete buttons, row menu entries —
 * from roles that lack them.
 *
 * The server enforces every one of these independently; this is a UX layer, not
 * the security boundary. Nothing renders while the session is still resolving,
 * so an action never flashes for a role that shouldn't see it.
 */
export function PermissionGuard({
  permission,
  requireAll = false,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { canAny, canAll, isLoading } = usePermissions();
  if (isLoading) return null;

  const required = Array.isArray(permission) ? permission : [permission];
  const isAllowed = requireAll ? canAll(...required) : canAny(...required);

  return <>{isAllowed ? children : fallback}</>;
}
