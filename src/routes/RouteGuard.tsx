import { AccessDeniedState, FullPageSpinner } from '@/components/states';
import { usePermissions } from '@/features/auth/auth.hooks';
import type { SystemPermission } from '@/lib/permissions';
import type { ReactNode } from 'react';

/**
 * Page-level gate. The sidebar only hides links — without this a manager could
 * still reach an admin-only page by typing the URL or following a stale
 * bookmark. Routes declare their permission in `Routes.tsx`; a route without
 * one needs authentication only (e.g. Settings, which is the admin's own
 * profile).
 */
export function RouteGuard({
  permission,
  children,
}: {
  permission?: SystemPermission;
  children: ReactNode;
}) {
  const { can, isLoading } = usePermissions();

  if (!permission) return <>{children}</>;
  // Never decide before the session resolves, or the page flashes "no access".
  if (isLoading) return <FullPageSpinner />;

  return <>{can(permission) ? children : <AccessDeniedState />}</>;
}
