import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { LuBan, LuCircleCheck, LuCircleSlash, LuUsers } from 'react-icons/lu';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { KpiCard } from '@/components/KpiCard';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/features/auth/auth.hooks';
import { formatMoneyPKR } from '@/lib/format';
import { SystemPermissions } from '@/lib/permissions';
import { TENANT_STATUS_TONE } from '@/lib/statusTones';
import type { TenantListItem, TenantStatus } from '@/lib/types';
import { useDebounce } from '@/lib/useDebounce';
import { useBulkTenantStatus, useTenants } from '../tenants.hooks';
import { Button } from '@/components/ui/button';

export function TenantsView() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'ALL'>('ALL');
  const search = useDebounce(searchInput, 350);
  const { can } = usePermissions();
  const canChangeStatus = can(SystemPermissions.TENANTS_STATUS_CHANGE);

  const { data, isLoading, isError, error, refetch } = useTenants({
    page,
    search,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    limit: pageSize,
  });
  const bulkStatusMutation = useBulkTenantStatus();

  // KPI counts — lightweight parallel queries (limit:1 → meta.total only)
  const { data: totalData, isLoading: kpiLoading } = useTenants({ page: 1, search: '', limit: 1 });
  const { data: activeData } = useTenants({ page: 1, search: '', status: 'ACTIVE', limit: 1 });
  const { data: suspendedData } = useTenants({
    page: 1,
    search: '',
    status: 'SUSPENDED',
    limit: 1,
  });
  const { data: churnedData } = useTenants({ page: 1, search: '', status: 'CHURNED', limit: 1 });

  const columns = useMemo<ColumnDef<TenantListItem, unknown>[]>(
    () => [
      {
        id: 'name',
        accessorFn: tenant => tenant.name.toLowerCase(),
        header: 'Name',
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        id: 'owner',
        accessorFn: tenant => tenant.owner?.email ?? '',
        header: 'Owner',
        cell: ({ row }) => (
          <span className="text-default-500">{row.original.owner?.email ?? '—'}</span>
        ),
      },
      {
        id: 'plan',
        accessorFn: tenant => tenant.activePlan?.name ?? '',
        header: 'Plan',
        cell: ({ row }) =>
          row.original.activePlan?.name ?? <span className="text-default-500">—</span>,
      },
      {
        id: 'revenue',
        accessorFn: tenant => tenant.revenue,
        header: 'Revenue',
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {formatMoneyPKR(row.original.revenue)}
          </span>
        ),
      },
      {
        id: 'members',
        accessorFn: tenant => tenant._count.memberships,
        header: 'Members',
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 text-default-500">
            <LuUsers className="size-3.5 shrink-0" />
            {row.original._count.memberships}
          </span>
        ),
      },
      {
        id: 'status',
        accessorFn: tenant => tenant.status,
        header: 'Status',
        cell: ({ row }) => (
          <Badge tone={TENANT_STATUS_TONE[row.original.status]}>{row.original.status}</Badge>
        ),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader title="Tenants" description="Workspaces, owners and teams" />

      {/* KPI cards */}
      <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Tenants"
          value={totalData?.meta.total}
          icon={LuUsers}
          variant="brand"
          isLoading={kpiLoading}
          sub="all workspaces"
        />
        <KpiCard
          label="Active"
          value={activeData?.meta.total}
          icon={LuCircleCheck}
          isLoading={kpiLoading}
          sub="live tenants"
        />
        <KpiCard
          label="Suspended"
          value={suspendedData?.meta.total}
          icon={LuBan}
          isLoading={kpiLoading}
          sub="temporarily paused"
        />
        <KpiCard
          label="Churned"
          value={churnedData?.meta.total}
          icon={LuCircleSlash}
          isLoading={kpiLoading}
          sub="cancelled"
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
        searchPlaceholder="Search by name or owner email…"
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        emptyMessage="No tenants found."
        enableSelection={canChangeStatus}
        getRowId={tenant => tenant.id}
        onRowClick={tenant => navigate(`/tenants/${tenant.id}`)}
        renderBulkActions={
          canChangeStatus
            ? (selectedTenantIds, clearSelection) => (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={bulkStatusMutation.isPending}
                    onClick={() =>
                      bulkStatusMutation.mutate(
                        { ids: selectedTenantIds, status: 'ACTIVE' },
                        { onSuccess: clearSelection }
                      )
                    }
                  >
                    <LuCircleCheck className="size-4 me-1" /> Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={bulkStatusMutation.isPending}
                    onClick={() =>
                      bulkStatusMutation.mutate(
                        { ids: selectedTenantIds, status: 'SUSPENDED' },
                        { onSuccess: clearSelection }
                      )
                    }
                  >
                    <LuBan className="size-4 me-1" /> Suspend
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={bulkStatusMutation.isPending}
                    onClick={() =>
                      bulkStatusMutation.mutate(
                        { ids: selectedTenantIds, status: 'CHURNED' },
                        { onSuccess: clearSelection }
                      )
                    }
                  >
                    <LuCircleSlash className="size-4 me-1" /> Churn
                  </Button>
                </>
              )
            : undefined
        }
        toolbarFilters={
          <Select
            value={statusFilter}
            onChange={event => {
              setStatusFilter(event.target.value as TenantStatus | 'ALL');
              setPage(1);
            }}
            className="form-input-sm w-36"
            aria-label="Filter by status"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="CHURNED">Churned</option>
          </Select>
        }
      />
    </>
  );
}
