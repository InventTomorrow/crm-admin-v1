import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import type { IconType } from 'react-icons/lib';
import {
  LuBuilding2,
  LuCalendar,
  LuCircleAlert,
  LuCircleCheck,
  LuClock,
  LuMessageCircle,
  LuPhone,
  LuShieldCheck,
  LuTriangleAlert,
} from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { UserDetailAccordionSkeleton } from '@/components/states';
import { WhatsAppNumbersTable } from '@/features/whatsapp-numbers/components/WhatsAppNumbersTable';
import { formatDate, formatRelative } from '@/lib/format';
import { TENANT_STATUS_TONE } from '@/lib/statusTones';
import { useUser, useUserWhatsAppNumbers } from '../users.hooks';

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: IconType;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="flex items-center gap-2.5 text-sm text-default-500">
        <span className="flex size-8 items-center justify-center rounded-md bg-default-100 text-default-500">
          <Icon className="size-4" />
        </span>
        {label}
      </span>
      <span className="min-w-0 truncate text-sm font-medium text-default-800">{value}</span>
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-default-500">
      {children}
    </h4>
  );
}

/** Sheet body — lazily fetches GET /admin/users/:id. */
export function UserDetailPanel({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const { data: user, isLoading, isError } = useUser(userId);
  const { data: whatsappNumbers, isLoading: isWhatsAppLoading } = useUserWhatsAppNumbers(userId);

  const [tenantSearch, setTenantSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  if (isLoading) return <UserDetailAccordionSkeleton />;

  if (isError || !user) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-danger">
        <LuCircleAlert className="size-4" />
        Failed to load user details.
      </div>
    );
  }

  const allRoleNames = Array.from(
    new Set(user.memberships.map(membership => membership.role.name))
  );

  const filteredMemberships = user.memberships.filter(membership => {
    const matchesTenant = membership.tenant.name.toLowerCase().includes(tenantSearch.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || membership.role.name === roleFilter;
    return matchesTenant && matchesRole;
  });

  return (
    <div className="space-y-6">
      {user.deletedAt && (
        <section className="rounded-lg border border-danger/30 bg-danger/5 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-danger">
            <LuTriangleAlert className="size-4" />
            {user.permanentlyDeletedAt
              ? 'Account permanently closed'
              : 'Account scheduled for deletion'}
          </h4>
          <p className="mt-1.5 text-sm text-default-600">
            Deleted {formatRelative(user.deletedAt)}.{' '}
            {user.permanentlyDeletedAt
              ? `Closed for good on ${formatDate(user.permanentlyDeletedAt)} — it can no longer be restored, and this email address stays permanently reserved.`
              : `Restorable until ${formatDate(user.scheduledPurgeAt)}${
                  user.deletionTenantIds.length > 0
                    ? `, along with ${user.deletionTenantIds.length} suspended workspace(s)`
                    : ''
                }.`}
          </p>
          {user.permanentlyDeletedAt && (
            <p className="mt-1.5 text-sm text-default-600">
              {user.workspaceDataWipedAt
                ? `Its workspaces and all of their data were erased on ${formatDate(user.workspaceDataWipedAt)}.`
                : 'Its workspaces still hold all of their data — erase them from the users list if they are no longer needed.'}
            </p>
          )}
        </section>
      )}

      {/* Profile */}
      <section>
        <SectionHeading>Profile</SectionHeading>
        <div className="divide-y divide-default-200 rounded-lg border border-default-200">
          <DetailRow icon={LuCalendar} label="Joined" value={formatDate(user.createdAt)} />
          <DetailRow icon={LuClock} label="Last login" value={formatRelative(user.lastLoginAt)} />
          <DetailRow
            icon={LuCircleCheck}
            label="Email verified"
            value={user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : 'No'}
          />
          <DetailRow icon={LuPhone} label="Phone" value={user.phone ?? '—'} />
          <DetailRow
            icon={LuShieldCheck}
            label="System role"
            value={
              user.systemMembership ? (
                <span className="flex items-center gap-2">
                  <Badge tone="primary">{user.systemMembership.role}</Badge>
                  <span className="text-xs font-normal text-default-400">
                    since {formatDate(user.systemMembership.createdAt)}
                  </span>
                </span>
              ) : (
                <span className="font-normal text-default-500">CRM user only</span>
              )
            }
          />
        </div>
      </section>

      {/* Memberships */}
      <section>
        <SectionHeading>
          <span className="flex items-center gap-1.5">
            <LuBuilding2 className="size-3.5" />
            Tenant memberships
            <span className="rounded-full bg-default-150 px-1.5 py-0.5 text-xs font-normal normal-case text-default-600">
              {user.memberships.length}
            </span>
          </span>
        </SectionHeading>

        {user.memberships.length > 0 && (
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_10rem]">
            <Input
              value={tenantSearch}
              onChange={event => setTenantSearch(event.target.value)}
              placeholder="Filter tenants…"
              className="form-input-sm"
            />
            <Select
              value={roleFilter}
              onChange={event => setRoleFilter(event.target.value)}
              className="form-input-sm"
              aria-label="Filter by role"
            >
              <option value="ALL">All roles</option>
              {allRoleNames.map(roleName => (
                <option key={roleName} value={roleName}>
                  {roleName}
                </option>
              ))}
            </Select>
          </div>
        )}

        {user.memberships.length === 0 ? (
          <p className="rounded-lg border border-dashed border-default-200 px-4 py-6 text-center text-sm text-default-500">
            Not a member of any tenant.
          </p>
        ) : filteredMemberships.length === 0 ? (
          <p className="rounded-lg border border-dashed border-default-200 px-4 py-6 text-center text-sm text-default-500">
            No memberships match the filter.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-default-200 bg-card">
            <table className="min-w-full divide-y divide-default-200">
              <thead className="bg-default-150">
                <tr className="text-start text-sm font-normal text-default-700">
                  <th className="px-3.5 py-2 text-start">Tenant</th>
                  <th className="px-3.5 py-2 text-start">Role</th>
                  <th className="px-3.5 py-2 text-start">Status</th>
                  <th className="px-3.5 py-2 text-start">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-200">
                {filteredMemberships.map(membership => (
                  <tr
                    key={membership.id}
                    className="cursor-pointer text-sm text-default-800 transition-colors hover:bg-primary/5"
                    onClick={() => navigate(`/tenants/${membership.tenant.id}`)}
                  >
                    <td className="px-3.5 py-2.5 font-medium">{membership.tenant.name}</td>
                    <td className="px-3.5 py-2.5">
                      <Badge tone="neutral">{membership.role.name}</Badge>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <Badge tone={TENANT_STATUS_TONE[membership.tenant.status] ?? 'neutral'}>
                        {membership.tenant.status}
                      </Badge>
                    </td>
                    <td className="px-3.5 py-2.5 text-default-500">
                      {formatRelative(membership.joinedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {user.ownedTenants.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-default-500">Owner of:</span>
            {user.ownedTenants.map(ownedTenant => (
              <Badge key={ownedTenant.id} tone="neutral">
                {ownedTenant.name}
              </Badge>
            ))}
          </div>
        )}
      </section>

      {/* WhatsApp numbers */}
      <section>
        <SectionHeading>
          <span className="flex items-center gap-1.5">
            <LuMessageCircle className="size-3.5" />
            WhatsApp numbers
          </span>
        </SectionHeading>
        <WhatsAppNumbersTable numbers={whatsappNumbers} isLoading={isWhatsAppLoading} showTenantColumn />
      </section>
    </div>
  );
}
