import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { LuArrowRightLeft, LuPlus, LuSquarePen, LuTrash2 } from 'react-icons/lu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/features/auth/auth.hooks';
import { PermissionGuard } from '@/components/PermissionGuard';
import { SystemPermissions } from '@/lib/permissions';
import { Select } from '@/components/ui/select';
import { formatPlanLimit, formatPlanPeriod, formatPlanPrice } from '@/lib/planFormat';
import type { BusinessVertical, Plan, PlanSortField, PlanTier } from '@/lib/types';
import { useListQueryState } from '@/lib/useListQueryState';
import { useServerSorting } from '@/lib/useServerSorting';
import { BUSINESS_VERTICALS, PLAN_TIERS } from '@/lib/plan';
import { useDeletePlan, usePlans, usePlansPage } from '../plans.hooks';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { MigratePlanDialog } from './MigratePlanDialog';

/** Plans with historical subscriptions cannot be deleted — say so before the request fails. */
function deletionWarning(plan: Plan | null): string {
  const totalSubscriberCount = plan?.totalSubscriberCount ?? 0;
  if (totalSubscriberCount === 0)
    return 'This cannot be undone. Workspaces on this plan may be affected.';
  return `This plan has ${totalSubscriberCount} subscription record${
    totalSubscriberCount === 1 ? '' : 's'
  } tied to it, including past ones. Deleting will be rejected — deactivate the plan instead.`;
}

const PLAN_SORTABLE_COLUMNS: PlanSortField[] = [
  'name',
  'tier',
  'price',
  'category',
  'state',
  'subs',
];

export function PlansView() {
  const deleteMutation = useDeletePlan();
  const { can, canAny } = usePermissions();
  const listQuery = useListQueryState({
    filters: { tier: 'ALL', businessVertical: 'ALL', isActive: 'ALL' },
  });
  const { page, pageSize, search, searchInput, filters } = listQuery;
  const [planPendingDeletion, setPlanPendingDeletion] = useState<Plan | null>(null);
  const [planPendingMigration, setPlanPendingMigration] = useState<Plan | null>(null);
  const { sorting, onSortingChange, sortBy, sortOrder } = useServerSorting<PlanSortField>({
    listQuery,
    sortableFields: PLAN_SORTABLE_COLUMNS,
  });

  const { data, isLoading, isFetching, isError, error, refetch } = usePlansPage({
    page,
    limit: pageSize,
    ...(sortBy ? { sortBy, sortOrder } : {}),
    ...(search ? { search } : {}),
    ...(filters.tier === 'ALL' ? {} : { tier: filters.tier as PlanTier }),
    ...(filters.businessVertical === 'ALL'
      ? {}
      : { businessVertical: filters.businessVertical as BusinessVertical }),
    ...(filters.isActive === 'ALL' ? {} : { isActive: filters.isActive as 'true' | 'false' }),
  });

  // The migrate dialog picks a target from the whole catalogue, not this page.
  const { data: allPlans = [] } = usePlans();

  const columns = useMemo<ColumnDef<Plan, unknown>[]>(
    () => [
      {
        id: 'name',
        accessorFn: plan => plan.name.toLowerCase(),
        header: 'Name',
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        id: 'tier',
        accessorFn: plan => plan.tier,
        header: 'Tier',
        cell: ({ row }) => <Badge tone="neutral">{row.original.tier}</Badge>,
      },
      {
        id: 'price',
        accessorFn: plan => plan.price,
        header: 'Price',
        cell: ({ row }) => (
          <span>
            {row.original.originalPrice != null && (
              <s className="me-1 text-xs text-default-400">
                {formatPlanPrice(row.original.originalPrice, row.original.currency)}
              </s>
            )}
            {formatPlanPrice(row.original.price, row.original.currency)}/
            {formatPlanPeriod(row.original.duration, row.original.customDurationDays)}
          </span>
        ),
      },
      {
        id: 'category',
        accessorFn: plan => plan.businessVertical ?? '',
        header: 'Category',
        cell: ({ row }) => (
          <span className="text-xs text-default-500">
            {row.original.businessVertical ?? 'All categories'}
          </span>
        ),
      },
      {
        id: 'limits',
        header: 'Limits',
        cell: ({ row }) => (
          <span className="text-xs text-default-500">
            {/* The column is narrow — an unlimited cap reads as ∞ here. */}
            {formatPlanLimit(row.original.maxWorkspaces, '∞')} ws ·{' '}
            {formatPlanLimit(row.original.maxMembersPerWorkspace, '∞')} members ·{' '}
            {formatPlanLimit(row.original.maxChannels, '∞')} ch
          </span>
        ),
      },
      {
        id: 'state',
        accessorFn: plan => (plan.isActive ? 1 : 0),
        header: 'State',
        cell: ({ row }) => (
          <Badge tone={row.original.isActive ? 'success' : 'neutral'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'subs',
        accessorFn: plan => plan._count?.subscriptions ?? 0,
        header: 'Subs',
        cell: ({ row }) => {
          const activeSubscriberCount = row.original._count?.subscriptions ?? 0;
          const totalSubscriberCount = row.original.totalSubscriberCount ?? activeSubscriberCount;
          return (
            <span>
              {activeSubscriberCount}
              {totalSubscriberCount > activeSubscriberCount && (
                <span className="ms-1 text-xs text-default-500">
                  · {totalSubscriberCount} total
                </span>
              )}
            </span>
          );
        },
      },
      ...(canAny(
        SystemPermissions.PLANS_EDIT,
        SystemPermissions.PLANS_MIGRATE_SUBSCRIBERS,
        SystemPermissions.PLANS_DELETE
      )
        ? [
            {
              id: 'actions',
              header: '',
              enableHiding: false,
              cell: ({ row }) => (
                <div className="flex gap-1">
                  {can(SystemPermissions.PLANS_EDIT) && (
                    <Link
                      to={`/plans/${row.original.id}/edit`}
                      aria-label="Edit plan"
                      className={buttonVariants({ variant: 'soft', size: 'icon-sm' })}
                    >
                      <LuSquarePen className="size-4" />
                    </Link>
                  )}
                  {can(SystemPermissions.PLANS_MIGRATE_SUBSCRIBERS) && (
                    <Button
                      aria-label="Move subscribers to another plan"
                      variant="soft"
                      size="icon-sm"
                      onClick={() => setPlanPendingMigration(row.original)}
                    >
                      <LuArrowRightLeft className="size-4" />
                    </Button>
                  )}
                  {can(SystemPermissions.PLANS_DELETE) && (
                    <Button
                      aria-label="Delete plan"
                      variant="soft-danger"
                      size="icon-sm"
                      onClick={() => setPlanPendingDeletion(row.original)}
                    >
                      <LuTrash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ),
            } satisfies ColumnDef<Plan, unknown>,
          ]
        : []),
    ],
    [can, canAny]
  );

  return (
    <>
      <PageHeader
        title="Plans"
        description="Subscription plans & limits"
        action={
          <PermissionGuard permission={SystemPermissions.PLANS_CREATE}>
            <Link to="/plans/new" className={buttonVariants({ size: 'sm' })}>
              <LuPlus className="size-4 me-1" /> New plan
            </Link>
          </PermissionGuard>
        }
      />

      <ConfirmDialog
        open={!!planPendingDeletion}
        onOpenChange={open => !open && setPlanPendingDeletion(null)}
        title={`Delete plan "${planPendingDeletion?.name}"?`}
        description={deletionWarning(planPendingDeletion)}
        onConfirm={() => {
          if (planPendingDeletion) deleteMutation.mutate(planPendingDeletion.id);
          setPlanPendingDeletion(null);
        }}
        isLoading={deleteMutation.isPending}
      />

      <MigratePlanDialog
        open={!!planPendingMigration}
        onOpenChange={open => !open && setPlanPendingMigration(null)}
        sourcePlan={planPendingMigration}
        plans={allPlans}
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        total={data?.meta.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={listQuery.setPage}
        onPageSizeChange={listQuery.setPageSize}
        sorting={sorting}
        onSortingChange={onSortingChange}
        search={searchInput}
        onSearchChange={listQuery.setSearchInput}
        searchPlaceholder="Search by plan name or tagline…"
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        emptyMessage="No plans match these filters."
        getRowId={plan => plan.id}
        activeFilterCount={listQuery.activeCount}
        onResetFilters={listQuery.resetAll}
        toolbarFilters={
          <>
            <Select
              value={filters.tier}
              onChange={event => listQuery.setFilter('tier', event.target.value)}
              className="form-input-sm w-36"
              aria-label="Filter by tier"
            >
              <option value="ALL">All tiers</option>
              {PLAN_TIERS.map(tier => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </Select>
            <Select
              value={filters.businessVertical}
              onChange={event => listQuery.setFilter('businessVertical', event.target.value)}
              className="form-input-sm w-44"
              aria-label="Filter by category"
            >
              <option value="ALL">All categories</option>
              {BUSINESS_VERTICALS.map(vertical => (
                <option key={vertical} value={vertical}>
                  {vertical.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
            <Select
              value={filters.isActive}
              onChange={event => listQuery.setFilter('isActive', event.target.value)}
              className="form-input-sm w-32"
              aria-label="Filter by state"
            >
              <option value="ALL">Any state</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </>
        }
      />
    </>
  );
}
