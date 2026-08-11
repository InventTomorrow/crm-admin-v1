import { LuCheck, LuLock } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/states';
import { usePermissionCatalog, useTenantRoles } from '../tenants.hooks';

/** Groups "leads:view" → { leads: ["leads:view", ...] } for a tidy display. */
function groupByDomain(permissions: string[]) {
  const domainMap = new Map<string, string[]>();
  for (const permission of permissions) {
    const domain = permission.split(':')[0];
    domainMap.set(domain, [...(domainMap.get(domain) ?? []), permission]);
  }
  return [...domainMap.entries()];
}

/**
 * READ-ONLY view of each workspace role's permissions. Platform admins can see
 * but never change tenant RBAC — that stays the workspace owner's job.
 */
export function RolePermissionsView({ tenantId }: { tenantId: string }) {
  const catalogQuery = usePermissionCatalog();
  const rolesQuery = useTenantRoles(tenantId);

  if (catalogQuery.isLoading || rolesQuery.isLoading) return <LoadingState />;
  const roles = rolesQuery.data ?? [];
  const groupedPermissions = groupByDomain(catalogQuery.data ?? []);
  if (roles.length === 0) {
    return <p className="text-sm text-default-500">No roles for this tenant.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-md border border-default-200 bg-default-50 px-3 py-2 text-xs text-default-500">
        <LuLock className="size-3.5" /> Read-only — workspace roles &amp; permissions are managed by
        the tenant owner.
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {roles.map(role => {
          const hasFullAccess = role.name === 'OWNER' || role.permissions.includes('*');
          const grantedPermissions = new Set(role.permissions);
          return (
            <div key={role.id} className="rounded-xl border border-default-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <Badge tone="primary">{role.name}</Badge>
                {hasFullAccess && <span className="text-xs text-default-500">Full access</span>}
              </div>
              {hasFullAccess ? (
                <p className="text-sm text-default-500">All permissions granted.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {groupedPermissions.map(([domain, domainPermissions]) => (
                    <div key={domain}>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-default-500">
                        {domain}
                      </p>
                      <ul className="space-y-1">
                        {domainPermissions.map(permission => {
                          const isGranted = grantedPermissions.has(permission);
                          return (
                            <li
                              key={permission}
                              className={
                                isGranted
                                  ? 'flex items-center gap-1.5 text-sm text-default-800'
                                  : 'flex items-center gap-1.5 text-sm text-default-400'
                              }
                            >
                              {isGranted ? (
                                <LuCheck className="size-3.5 text-primary" />
                              ) : (
                                <span className="size-3.5" />
                              )}
                              {permission.split(':')[1]}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
