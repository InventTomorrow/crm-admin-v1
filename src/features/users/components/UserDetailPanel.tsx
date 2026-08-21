import { UserDetailAccordionSkeleton } from '@/components/states';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { WhatsAppNumbersTable } from '@/features/whatsapp-numbers/components/WhatsAppNumbersTable';
import { formatDate, formatFullName, formatMoneyPKR, formatRelative } from '@/lib/format';
import { isOnPaidPlan, planLabel, planTone } from '@/lib/plan';
import { SUBSCRIPTION_STATUS_TONE, TENANT_STATUS_TONE } from '@/lib/statusTones';
import { cn } from '@/lib/utils';
import { useState, type ReactNode } from 'react';
import {
  LuBuilding2,
  LuCircleAlert,
  LuCircleCheck,
  LuCircleX,
  LuCreditCard,
  LuMessageCircle,
  LuTriangleAlert,
} from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { useUser, useUserWhatsAppNumbers } from '../users.hooks';
import { UserAvatar } from './UserAvatar';

/** Label-above-value cell — reads as a tile, not a table row. */
function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0 px-4 py-3', className)}>
      <dt className="text-xs font-medium uppercase tracking-wide text-default-400">{label}</dt>
      <dd className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-default-800">
        {value}
      </dd>
    </div>
  );
}

/** Two-up tile grid; each `Field` becomes its own bordered card. */
function FieldGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <dl
      className={cn(
        'grid grid-cols-1 gap-2 sm:grid-cols-2',
        '[&>div]:rounded-lg [&>div]:border [&>div]:border-default-200 [&>div]:bg-card',
        className
      )}
    >
      {children}
    </dl>
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

  // Owned workspaces used to repeat below the table; they are folded into the
  // rows instead — ownership becomes a badge and the counts become the subline.
  const ownedTenantsById = new Map(user.ownedTenants.map(tenant => [tenant.id, tenant]));

  const tenantRows = [
    ...user.memberships.map(membership => ({
      key: membership.id,
      tenant: membership.tenant,
      roleName: membership.role.name,
      joinedAt: membership.joinedAt as string | null,
      owned: ownedTenantsById.get(membership.tenant.id) ?? null,
    })),
    // Workspaces this user owns without holding a membership row of their own.
    ...user.ownedTenants
      .filter(tenant => !user.memberships.some(membership => membership.tenant.id === tenant.id))
      .map(tenant => ({
        key: tenant.id,
        tenant,
        roleName: 'Owner',
        joinedAt: null,
        owned: tenant,
      })),
  ];

  const allRoleNames = Array.from(new Set(tenantRows.map(row => row.roleName)));

  const filteredTenantRows = tenantRows.filter(row => {
    const matchesTenant = row.tenant.name.toLowerCase().includes(tenantSearch.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || row.roleName === roleFilter;
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
              ? `Closed for good on ${formatDate(user.permanentlyDeletedAt)} — it can no longer be restored. The email address was released, so ${user.originalEmail ?? user.email} can be used to sign up again as a new account.`
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

      {/* Identity + headline counts, so the sheet answers "who is this" at a glance */}
      <section className="flex items-center gap-4 rounded-lg border border-default-200 p-4">
        <UserAvatar
          firstName={user.firstName}
          lastName={user.lastName}
          email={user.email}
          avatarUrl={user.avatarUrl}
          hasPaidPlan={isOnPaidPlan(user.activeSubscription)}
          className="size-14 text-lg"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-default-800">
            {formatFullName(user.firstName, user.lastName)}
          </p>
          <p className="truncate text-sm text-default-500">{user.originalEmail ?? user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={planTone(user.activeSubscription)}>
              {planLabel(user.activeSubscription)}
            </Badge>
            <Badge tone="neutral">
              {user._count.memberships} workspace{user._count.memberships === 1 ? '' : 's'}
            </Badge>
            {user._count.ownedTenants > 0 && (
              <Badge tone="info">Owns {user._count.ownedTenants}</Badge>
            )}
            {user._count.ownedTenants > 0 && (
              <Badge tone="success">{formatMoneyPKR(user.ownedRevenue)} revenue</Badge>
            )}
            {whatsappNumbers && whatsappNumbers.length > 0 && (
              <Badge tone="success">
                {whatsappNumbers.filter(number => number.isActive).length} WhatsApp connected
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Current plan */}
      <section>
        <SectionHeading>
          <span className="flex items-center gap-1.5">
            <LuCreditCard className="size-3.5" />
            Plan &amp; billing
          </span>
        </SectionHeading>
        {user.activeSubscription ? (
          <div className="overflow-hidden rounded-lg border border-default-200 bg-card">
            {/* Headline: plan name + price carry the weight, dates sit underneath */}
            <div className="flex items-start justify-between gap-3 border-b border-default-200 bg-default-50 px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <LuCreditCard className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-default-800">
                    {user.activeSubscription.plan.name}
                  </p>
                  <p className="mt-0.5 text-sm text-default-500">
                    {user.activeSubscription.plan.isTrial
                      ? 'No charge during trial'
                      : `${formatMoneyPKR(user.activeSubscription.plan.price)} per cycle`}
                  </p>
                </div>
              </div>
              <Badge tone={SUBSCRIPTION_STATUS_TONE[user.activeSubscription.status]}>
                {user.activeSubscription.status}
              </Badge>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2">
              {user.activeSubscription.status === 'TRIALING' && (
                <Field label="Trial ends" value={formatDate(user.activeSubscription.trialEndsAt)} />
              )}
              <Field
                label="Renews / ends"
                value={formatDate(user.activeSubscription.currentPeriodEnd)}
              />
              {user.activeSubscription.cancelledAt && (
                <Field
                  label="Cancelled"
                  value={
                    <span className="flex items-center gap-1.5 text-danger">
                      <LuTriangleAlert className="size-3.5" />
                      {formatDate(user.activeSubscription.cancelledAt)}
                    </span>
                  }
                />
              )}
            </dl>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-default-200 px-4 py-6 text-center text-sm text-default-500">
            No active plan — this account has never subscribed or its plan has lapsed.
          </p>
        )}

        {user.subscriptionHistory.length > 1 && (
          <details className="mt-2 rounded-lg border border-default-200 px-4 py-3">
            <summary className="cursor-pointer text-sm text-default-600">
              Billing history ({user.subscriptionHistory.length})
            </summary>
            <ul className="mt-3 space-y-2">
              {user.subscriptionHistory.map(subscription => (
                <li
                  key={subscription.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="truncate text-default-700">{subscription.plan.name}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge tone={SUBSCRIPTION_STATUS_TONE[subscription.status]}>
                      {subscription.status}
                    </Badge>
                    <span className="text-xs text-default-400">
                      {formatDate(subscription.createdAt)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* Profile */}
      <section>
        <SectionHeading>Profile</SectionHeading>
        <FieldGrid>
          <Field
            label="Email"
            className="sm:col-span-2"
            value={<span className="break-all">{user.originalEmail ?? user.email}</span>}
          />
          <Field
            label="Phone"
            value={
              user.phone ? (
                <a href={`tel:${user.phone}`} className="hover:text-primary">
                  {user.phone}
                </a>
              ) : (
                <span className="text-default-400">Not provided</span>
              )
            }
          />
          <Field label="Joined" value={formatDate(user.createdAt)} />
          <Field label="Last login" value={formatRelative(user.lastLoginAt)} />
          <Field
            label="Email verified"
            value={
              user.emailVerifiedAt ? (
                <span className="flex items-center gap-1.5 text-success">
                  <LuCircleCheck className="size-3.5" />
                  {formatDate(user.emailVerifiedAt)}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-danger">
                  <LuCircleX className="size-3.5" />
                  Not verified
                </span>
              )
            }
          />
          <Field label="Onboarding" value={<Badge tone="neutral">{user.onboardingStatus}</Badge>} />
          <Field
            label="System role"
            value={
              user.systemMembership ? (
                <>
                  <Badge tone="primary">{user.systemMembership.role}</Badge>
                  <span className="text-xs font-normal text-default-400">
                    since {formatDate(user.systemMembership.createdAt)}
                  </span>
                </>
              ) : (
                <span className="font-normal text-default-500">CRM user only</span>
              )
            }
          />
          {user.isTester && (
            <Field
              label="Tester account"
              value={<Badge tone="warning">Exempt from plan limits</Badge>}
            />
          )}
        </FieldGrid>
      </section>

      {/* Memberships */}
      <section>
        <SectionHeading>
          <span className="flex items-center gap-1.5">
            <LuBuilding2 className="size-3.5" />
            Workspaces
            <span className="rounded-full bg-default-150 px-1.5 py-0.5 text-xs font-normal normal-case text-default-600">
              {tenantRows.length}
            </span>
          </span>
        </SectionHeading>

        {user._count.ownedTenants > 0 && (
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-default-200 bg-default-50 px-4 py-3">
            <span className="text-xs font-medium uppercase tracking-wide text-default-400">
              Total order revenue · {user._count.ownedTenants} owned workspace
              {user._count.ownedTenants === 1 ? '' : 's'}
            </span>
            <span className="text-lg font-semibold tabular-nums text-default-800">
              {formatMoneyPKR(user.ownedRevenue)}
            </span>
          </div>
        )}

        {tenantRows.length > 0 && (
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

        {tenantRows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-default-200 px-4 py-6 text-center text-sm text-default-500">
            Not a member of any workspace.
          </p>
        ) : filteredTenantRows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-default-200 px-4 py-6 text-center text-sm text-default-500">
            No workspaces match the filter.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-default-200 bg-card">
            <table className="min-w-full divide-y divide-default-200">
              <thead className="bg-default-150">
                <tr className="text-start text-sm font-normal text-default-700">
                  <th className="px-3.5 py-2 text-start">Workspace</th>
                  <th className="px-3.5 py-2 text-start">Revenue</th>
                  <th className="px-3.5 py-2 text-start">Role</th>
                  <th className="px-3.5 py-2 text-start">Status</th>
                  <th className="px-3.5 py-2 text-start">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-200">
                {filteredTenantRows.map(row => (
                  <tr
                    key={row.key}
                    className="cursor-pointer text-sm text-default-800 transition-colors hover:bg-primary/5"
                    onClick={() => navigate(`/tenants/${row.tenant.id}`)}
                  >
                    <td className="px-3.5 py-2.5">
                      <span className="font-medium">{row.tenant.name}</span>
                      <span className="mt-0.5 block text-xs text-default-500">
                        {row.owned
                          ? `${row.tenant.businessVertical} · ${row.owned._count.leads} leads · ${row.owned._count.products} products · ${row.owned._count.memberships} members`
                          : row.tenant.businessVertical}
                      </span>
                    </td>
                    {/* Revenue is only aggregated for workspaces this user
                        owns — a plain membership carries no figure here. */}
                    <td className="px-3.5 py-2.5 tabular-nums">
                      {row.owned ? (
                        formatMoneyPKR(row.owned.revenue)
                      ) : (
                        <span className="text-default-400">—</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge tone="neutral">{row.roleName}</Badge>
                        {/* {row.owned && <Badge tone="info">Owner</Badge>} */}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={TENANT_STATUS_TONE[row.tenant.status] ?? 'neutral'}>
                          {row.tenant.status}
                        </Badge>
                        {row.owned?.suspendedByUserDeletion && (
                          <Badge tone="danger">Closed by deletion</Badge>
                        )}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-default-500">
                      {row.joinedAt ? formatRelative(row.joinedAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        <WhatsAppNumbersTable
          numbers={whatsappNumbers}
          isLoading={isWhatsAppLoading}
          showTenantColumn
        />
      </section>
    </div>
  );
}
