import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { LuBuilding2, LuEllipsis, LuShieldCheck, LuUser, LuUsers } from 'react-icons/lu';
import { Select } from '@/components/ui/select';
import { Dropdown, DropdownItem, DropdownLabel } from '@/components/ui/dropdown';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { KpiCard } from '@/components/KpiCard';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/features/auth/auth.hooks';
import { SystemPermissions } from '@/lib/permissions';
import { formatDate, formatFullName } from '@/lib/format';
import type { UserListItem } from '@/lib/types';
import { useDebounce } from '@/lib/useDebounce';
import { CreateUserDialog } from './CreateUserDialog';
import { UserDetailSheet } from './UserDetailSheet';
import {
  useDeleteUser,
  useRestoreUser,
  useSetSystemRole,
  useUsers,
  useWipeUserWorkspaces,
} from '../users.hooks';

const userInitials = (user: UserListItem) => {
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  return initials || user.email[0]?.toUpperCase() || '?';
};

type UserTypeFilter = 'all' | 'system' | 'crm';
type UserStatusFilter = 'active' | 'deleted' | 'all';

export function UsersView() {
  const [typeFilter, setTypeFilter] = useState<UserTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('active');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 350);
  const { can, canAny } = usePermissions();

  const { data, isLoading, isError, error, refetch } = useUsers({
    type: typeFilter,
    status: statusFilter,
    page,
    search,
    limit: pageSize,
  });
  const roleMutation = useSetSystemRole();
  const deleteMutation = useDeleteUser();
  const restoreMutation = useRestoreUser();
  const wipeMutation = useWipeUserWorkspaces();
  const [userPendingDeletion, setUserPendingDeletion] = useState<UserListItem | null>(null);
  const [userPendingRestore, setUserPendingRestore] = useState<UserListItem | null>(null);
  const [userPendingWipe, setUserPendingWipe] = useState<UserListItem | null>(null);
  const [userUnderReview, setUserUnderReview] = useState<UserListItem | null>(null);

  const columns = useMemo<ColumnDef<UserListItem, unknown>[]>(
    () => [
      {
        id: 'name',
        accessorFn: user => formatFullName(user.firstName, user.lastName).toLowerCase(),
        header: 'Name',
        cell: ({ row }) => (
          <span className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-default-200 font-semibold">
              {userInitials(row.original)}
            </span>
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
        accessorFn: user => user.email,
        header: 'Email',
        cell: ({ row }) => <span className="text-default-500">{row.original.email}</span>,
      },
      {
        id: 'workspaces',
        accessorFn: user => user._count.memberships,
        header: 'Workspaces',
        cell: ({ row }) => row.original._count.memberships,
      },
      {
        id: 'last login',
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
                            onSelect={() =>
                              roleMutation.mutate({ id: user.id, role: 'SYSTEM_ADMIN' })
                            }
                          >
                            Make System Admin
                          </DropdownItem>
                          <DropdownItem
                            onSelect={() =>
                              roleMutation.mutate({ id: user.id, role: 'SYSTEM_MANAGER' })
                            }
                          >
                            Make System Manager
                          </DropdownItem>
                          {user.systemMembership && (
                            <DropdownItem
                              onSelect={() => roleMutation.mutate({ id: user.id, role: null })}
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
    [roleMutation, can, canAny]
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
        description="This cannot be undone."
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
        description="Permanently deletes every workspace this account owns and all of their data — leads, conversations, orders, products and settings. The user record itself is kept. This cannot be undone."
        onConfirm={() => {
          if (userPendingWipe) wipeMutation.mutate(userPendingWipe.id);
          setUserPendingWipe(null);
        }}
        isLoading={wipeMutation.isPending}
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
        search={searchInput}
        onSearchChange={value => {
          setSearchInput(value);
          setPage(1);
        }}
        searchPlaceholder="Search by name or email…"
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        emptyMessage="No users found."
        getRowId={user => user.id}
        onRowClick={user => setUserUnderReview(user)}
        alternatingRows
        getRowClassName={user =>
          user.deletedAt ? 'bg-danger/5' : user.systemMembership ? 'bg-warning/10' : ''
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
