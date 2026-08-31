import { KpiCard } from '@/components/KpiCard';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { Dropdown, DropdownItem, DropdownLabel } from '@/components/ui/dropdown';
import { Select } from '@/components/ui/select';
import { usePermissions } from '@/features/auth/auth.hooks';
import { formatDate, formatFullName, formatMoneyPKR } from '@/lib/format';
import { SystemPermissions } from '@/lib/permissions';
import { isOnPaidPlan } from '@/lib/plan';
import type { SystemRole, UserListItem, UserSortField } from '@/lib/types';
import { useDebounce } from '@/lib/useDebounce';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import {
  LuBuilding2,
  LuDownload,
  LuEllipsis,
  LuRotateCcw,
  LuShieldCheck,
  LuShieldOff,
  LuTrash2,
  LuUser,
  LuUsers,
} from 'react-icons/lu';
import {
  useBulkDeleteUsers,
  useDeleteUser,
  useExportUsers,
  useRestoreUser,
  useSetSystemRole,
  useUsers,
  useWipeUserWorkspaces,
} from '../users.hooks';
import { CreateUserDialog } from './CreateUserDialog';
import { UserAvatar } from './UserAvatar';
import { UserDetailSheet } from './UserDetailSheet';

type UserTypeFilter = 'all' | 'system' | 'crm';
type UserStatusFilter = 'active' | 'deleted' | 'all';

/** Column ids double as the server's sort keys, so the two can never drift. */
const SORTABLE_COLUMNS: UserSortField[] = [
  'name',
  'email',
  'phone',
  'lastLoginAt',
  'workspaces',
  'revenue',
];

const ROLE_LABEL: Record<SystemRole, string> = {
  SYSTEM_ADMIN: 'System Admin',
  SYSTEM_MANAGER: 'System Manager',
};

/**
 * Confirmation copy for closing an account. The workspace fallout leads, since
 * that is the part the admin cannot see from the row they clicked.
 */
function deletionWarning(user: UserListItem | null): string {
  const ownedCount = user?._count.ownedTenants ?? 0;
  const workspaceFallout =
    ownedCount > 0
      ? `The ${ownedCount} workspace${ownedCount === 1 ? '' : 's'} this user owns ${
          ownedCount === 1 ? 'is' : 'are'
        } suspended along with the account — every member loses access and any connected WhatsApp number is dropped. `
      : '';
  return `${workspaceFallout}Nothing is erased: the account and its workspaces stay restorable until the purge date, after which the closure is permanent.`;
}

export function UsersView() {
  const [typeFilter, setTypeFilter] = useState<UserTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('active');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const search = useDebounce(searchInput, 350);
  const { can, canAny } = usePermissions();

  const activeSort = sorting[0];
  const sortBy = (
    activeSort && SORTABLE_COLUMNS.includes(activeSort.id as UserSortField)
      ? activeSort.id
      : 'createdAt'
  ) as UserSortField;
  const sortOrder = activeSort?.desc === false ? 'asc' : 'desc';

  const listFilters = {
    type: typeFilter,
    status: statusFilter,
    search,
    sortBy,
    sortOrder,
  } as const;

  const { data, isLoading, isError, error, refetch } = useUsers({
    ...listFilters,
    page,
    limit: pageSize,
  });
  const roleMutation = useSetSystemRole();
  const deleteMutation = useDeleteUser();
  const restoreMutation = useRestoreUser();
  const wipeMutation = useWipeUserWorkspaces();
  const exportMutation = useExportUsers();
  const bulkDeleteMutation = useBulkDeleteUsers();

  const [userPendingDeletion, setUserPendingDeletion] = useState<UserListItem | null>(null);
  const [userPendingRestore, setUserPendingRestore] = useState<UserListItem | null>(null);
  const [userPendingWipe, setUserPendingWipe] = useState<UserListItem | null>(null);
  const [userUnderReview, setUserUnderReview] = useState<UserListItem | null>(null);
  const [roleChangePending, setRoleChangePending] = useState<{
    user: UserListItem;
    role: SystemRole | null;
  } | null>(null);
  const [bulkDeletePending, setBulkDeletePending] = useState<{
    ids: string[];
    clear: () => void;
  } | null>(null);

  const columns = useMemo<ColumnDef<UserListItem, unknown>[]>(
    () => [
      {
        id: 'name',
        // Accessors exist so the header renders as sortable — the ordering
        // itself is done by the server (manualSorting), not by these values.
        accessorFn: user => formatFullName(user.firstName, user.lastName),
        header: 'Name',
        cell: ({ row }) => (
          <span className="flex items-center gap-3">
            <UserAvatar
              firstName={row.original.firstName}
              lastName={row.original.lastName}
              email={row.original.email}
              avatarUrl={row.original.avatarUrl}
              hasPaidPlan={isOnPaidPlan(row.original.activeSubscription)}
            />
            <span className="flex items-center gap-2 font-medium">
              {formatFullName(row.original.firstName, row.original.lastName)}
              {row.original.systemMembership && (
                <Badge tone="primary">
                  {row.original.systemMembership.role === 'SYSTEM_ADMIN' ? 'Admin' : 'Manager'}
                </Badge>
              )}
              {row.original.deletedAt && (
                <Badge tone="danger">
                  {row.original.permanentlyDeletedAt ? 'Closed' : 'Deleted'}
                </Badge>
              )}
            </span>
          </span>
        ),
      },
      {
        id: 'email',
        accessorFn: user => user.originalEmail ?? user.email,
        header: 'Email',
        cell: ({ row }) => (
          // A closed account's `email` is a tombstone — show the real address.
          <span className="text-default-500">
            {row.original.originalEmail ?? row.original.email}
          </span>
        ),
      },
      {
        id: 'phone',
        accessorFn: user => user.phone ?? '',
        header: 'Phone',
        cell: ({ row }) =>
          row.original.phone ? (
            <a
              href={`tel:${row.original.phone}`}
              className="text-default-600 hover:text-primary"
              onClick={event => event.stopPropagation()}
            >
              {row.original.phone}
            </a>
          ) : (
            <span className="text-default-400">—</span>
          ),
      },
      {
        id: 'workspaces',
        accessorFn: user => user._count.memberships,
        header: 'Workspaces',
        cell: ({ row }) => row.original._count.memberships,
      },
      {
        // Matches the server's sort key; the field on the row is `ownedRevenue`.
        id: 'revenue',
        accessorFn: user => user.ownedRevenue,
        header: 'Revenue',
        cell: ({ row }) => (
          <span
            className="font-medium tabular-nums"
            title="Order revenue across all workspaces this user owns"
          >
            {formatMoneyPKR(row.original.ownedRevenue)}
          </span>
        ),
      },
      {
        id: 'lastLoginAt',
        accessorFn: user => user.lastLoginAt ?? '',
        header: 'Last login',
        cell: ({ row }) => (
          <span className="text-default-500">{formatDate(row.original.lastLoginAt)}</span>
        ),
      },
      ...(canAny(
        SystemPermissions.USERS_ROLE_CHANGE,
        SystemPermissions.USERS_DELETE,
        SystemPermissions.USERS_RESTORE,
        SystemPermissions.USERS_WIPE_WORKSPACES
      )
        ? [
            {
              id: 'actions',
              header: '',
              enableHiding: false,
              enableSorting: false,
              cell: ({ row }) => {
                const user = row.original;
                // A deleted account offers the rescue path until it closes for
                // good; after that the only remaining action is erasing the
                // workspaces it left behind.
                if (user.deletedAt) {
                  return (
                    <span onClick={event => event.stopPropagation()}>
                      <Dropdown
                        trigger={<LuEllipsis className="size-4" />}
                        triggerLabel="User actions"
                      >
                        {!user.permanentlyDeletedAt && can(SystemPermissions.USERS_RESTORE) && (
                          <DropdownItem onSelect={() => setUserPendingRestore(user)}>
                            Restore account
                          </DropdownItem>
                        )}
                        {user.permanentlyDeletedAt &&
                          !user.workspaceDataWipedAt &&
                          can(SystemPermissions.USERS_WIPE_WORKSPACES) && (
                            <>
                              <DropdownLabel>Closed — cannot be restored</DropdownLabel>
                              <DropdownItem destructive onSelect={() => setUserPendingWipe(user)}>
                                Erase workspaces
                              </DropdownItem>
                            </>
                          )}
                        {user.permanentlyDeletedAt && user.workspaceDataWipedAt && (
                          <DropdownLabel>Closed — workspaces erased</DropdownLabel>
                        )}
                      </Dropdown>
                    </span>
                  );
                }
                return (
                  <span onClick={event => event.stopPropagation()}>
                    <Dropdown
                      trigger={<LuEllipsis className="size-4" />}
                      triggerLabel="User actions"
                    >
                      {can(SystemPermissions.USERS_ROLE_CHANGE) && (
                        <>
                          <DropdownLabel>System role</DropdownLabel>
                          <DropdownItem
                            onSelect={() => setRoleChangePending({ user, role: 'SYSTEM_ADMIN' })}
                          >
                            Make System Admin
                          </DropdownItem>
                          <DropdownItem
                            onSelect={() => setRoleChangePending({ user, role: 'SYSTEM_MANAGER' })}
                          >
                            Make System Manager
                          </DropdownItem>
                          {user.systemMembership && (
                            <DropdownItem
                              onSelect={() => setRoleChangePending({ user, role: null })}
                            >
                              Revoke system role
                            </DropdownItem>
                          )}
                        </>
                      )}
                      {can(SystemPermissions.USERS_DELETE) && (
                        <>
                          {can(SystemPermissions.USERS_ROLE_CHANGE) && (
                            <div className="-mx-2 my-1 border-t border-default-200" />
                          )}
                          <DropdownItem destructive onSelect={() => setUserPendingDeletion(user)}>
                            Delete user
                          </DropdownItem>
                        </>
                      )}
                    </Dropdown>
                  </span>
                );
              },
            } satisfies ColumnDef<UserListItem, unknown>,
          ]
        : []),
    ],
    [can, canAny]
  );

  // KPI counts — three tiny parallel queries (limit:1 → only meta.total matters)
  const { data: allUsersData, isLoading: kpiLoading } = useUsers({
    type: 'all',
    page: 1,
    search: '',
    limit: 1,
  });
  const { data: systemUsersData } = useUsers({ type: 'system', page: 1, search: '', limit: 1 });
  const { data: crmUsersData } = useUsers({ type: 'crm', page: 1, search: '', limit: 1 });

  const canDelete = can(SystemPermissions.USERS_DELETE);

  return (
    <>
      <PageHeader
        title="Users"
        description="All CRM and system users"
        action={
          can(SystemPermissions.USERS_CREATE) ? (
            <CreateUserDialog defaultSystem={typeFilter === 'system'} />
          ) : undefined
        }
      />

      <ConfirmDialog
        open={!!userPendingDeletion}
        onOpenChange={open => !open && setUserPendingDeletion(null)}
        title={`Delete ${userPendingDeletion?.email}?`}
        description={deletionWarning(userPendingDeletion)}
        confirmLabel="Delete user"
        onConfirm={() => {
          if (userPendingDeletion) deleteMutation.mutate(userPendingDeletion.id);
          setUserPendingDeletion(null);
        }}
        isLoading={deleteMutation.isPending}
      />

      <ConfirmDialog
        open={!!userPendingRestore}
        onOpenChange={open => !open && setUserPendingRestore(null)}
        title={`Restore ${userPendingRestore?.email}?`}
        description="Reactivates the account and every workspace its deletion closed."
        intent="success"
        icon={LuRotateCcw}
        confirmLabel="Restore account"
        onConfirm={() => {
          if (userPendingRestore) restoreMutation.mutate(userPendingRestore.id);
          setUserPendingRestore(null);
        }}
        isLoading={restoreMutation.isPending}
      />

      <ConfirmDialog
        open={!!userPendingWipe}
        onOpenChange={open => !open && setUserPendingWipe(null)}
        title={`Erase workspaces owned by ${userPendingWipe?.email}?`}
        confirmLabel="Erase workspaces"
        description="Permanently deletes every workspace this account owns and all of their data — leads, conversations, orders, products and settings. The user record itself is kept. This cannot be undone."
        onConfirm={() => {
          if (userPendingWipe) wipeMutation.mutate(userPendingWipe.id);
          setUserPendingWipe(null);
        }}
        isLoading={wipeMutation.isPending}
      />

      <ConfirmDialog
        open={!!roleChangePending}
        onOpenChange={open => !open && setRoleChangePending(null)}
        title={
          roleChangePending?.role
            ? `Make ${roleChangePending.user.email} a ${ROLE_LABEL[roleChangePending.role]}?`
            : `Revoke ${roleChangePending?.user.email}'s system role?`
        }
        description={
          roleChangePending?.role === 'SYSTEM_ADMIN'
            ? 'System Admins have full access to the admin portal, including billing and every user account.'
            : roleChangePending?.role === 'SYSTEM_MANAGER'
              ? 'System Managers can manage subscriptions and workspaces, but not user accounts or platform settings.'
              : 'They immediately lose all access to the admin portal.'
        }
        intent={roleChangePending?.role ? 'info' : 'warning'}
        icon={roleChangePending?.role ? LuShieldCheck : LuShieldOff}
        confirmLabel={
          roleChangePending?.role
            ? `Grant ${ROLE_LABEL[roleChangePending.role]}`
            : 'Revoke system role'
        }
        onConfirm={() => {
          if (roleChangePending) {
            roleMutation.mutate({ id: roleChangePending.user.id, role: roleChangePending.role });
          }
          setRoleChangePending(null);
        }}
        isLoading={roleMutation.isPending}
      />

      <ConfirmDialog
        open={!!bulkDeletePending}
        onOpenChange={open => !open && setBulkDeletePending(null)}
        title={`Delete ${bulkDeletePending?.ids.length ?? 0} user(s)?`}
        description="Each account is closed together with the workspaces it owns — their members lose access and connected WhatsApp numbers are dropped. Nothing is erased; all of it stays restorable until each account's purge date. Accounts that are already closed are skipped."
        confirmLabel={`Delete ${bulkDeletePending?.ids.length ?? 0} user(s)`}
        onConfirm={() => {
          if (bulkDeletePending) {
            bulkDeleteMutation.mutate(bulkDeletePending.ids, {
              onSuccess: () => bulkDeletePending.clear(),
            });
          }
          setBulkDeletePending(null);
        }}
        isLoading={bulkDeleteMutation.isPending}
      />

      {/* KPI cards */}
      <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Users"
          value={allUsersData?.meta.total}
          icon={LuUsers}
          variant="brand"
          isLoading={kpiLoading}
          sub="across all roles"
        />
        <KpiCard
          label="System Users"
          value={systemUsersData?.meta.total}
          icon={LuShieldCheck}
          isLoading={kpiLoading}
          sub="admins & managers"
        />
        <KpiCard
          label="CRM Users"
          value={crmUsersData?.meta.total}
          icon={LuUser}
          isLoading={kpiLoading}
          sub="workspace members"
        />
        <KpiCard
          label="Workspaces"
          value={data?.items.reduce((sum, user) => sum + user._count.memberships, 0)}
          icon={LuBuilding2}
          isLoading={isLoading}
          sub="memberships on page"
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        total={data?.meta.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={size => {
          setPageSize(size);
          setPage(1);
        }}
        sorting={sorting}
        onSortingChange={nextSorting => {
          setSorting(nextSorting);
          // A re-sorted list reshuffles every page, so page 1 is the only
          // meaningful place to land.
          setPage(1);
        }}
        search={searchInput}
        onSearchChange={value => {
          setSearchInput(value);
          setPage(1);
        }}
        searchPlaceholder="Search by name, email or phone…"
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        emptyMessage="No users found."
        getRowId={user => user.id}
        onRowClick={user => setUserUnderReview(user)}
        alternatingRows
        // Selection drives "Export selected" too, so it isn't gated on delete.
        enableSelection
        getRowClassName={user =>
          user.deletedAt ? 'bg-danger/5' : user.systemMembership ? 'bg-warning/10' : ''
        }
        renderBulkActions={(selectedIds, clear) => (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportMutation.mutate({ ...listFilters, ids: selectedIds })}
              disabled={exportMutation.isPending}
            >
              <LuDownload className="size-4" />
              Export selected
            </Button>
            {canDelete && (
              <Button
                variant="soft-danger"
                size="sm"
                onClick={() => setBulkDeletePending({ ids: selectedIds, clear })}
              >
                <LuTrash2 className="size-4" />
                Delete selected
              </Button>
            )}
          </>
        )}
        toolbarAction={
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportMutation.mutate(listFilters)}
            disabled={exportMutation.isPending || data?.meta.total === 0}
          >
            <LuDownload className="size-4" />
            {exportMutation.isPending ? 'Exporting…' : 'Export'}
          </Button>
        }
        toolbarFilters={
          <>
            <Select
              value={typeFilter}
              onChange={event => {
                setTypeFilter(event.target.value as UserTypeFilter);
                setPage(1);
              }}
              className="form-input-sm w-36"
              aria-label="Filter by user type"
            >
              <option value="all">All users</option>
              <option value="system">System users</option>
              <option value="crm">CRM users</option>
            </Select>
            <Select
              value={statusFilter}
              onChange={event => {
                setStatusFilter(event.target.value as UserStatusFilter);
                setPage(1);
              }}
              className="form-input-sm w-36"
              aria-label="Filter by account status"
            >
              <option value="active">Active</option>
              <option value="deleted">Deleted</option>
              <option value="all">All statuses</option>
            </Select>
          </>
        }
      />

      <UserDetailSheet
        user={userUnderReview}
        open={userUnderReview !== null}
        onClose={() => setUserUnderReview(null)}
      />
    </>
  );
}
