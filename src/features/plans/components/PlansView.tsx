import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { LuArrowRightLeft, LuPlus, LuSquarePen, LuTrash2 } from 'react-icons/lu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { useCanWrite } from '@/features/auth/auth.hooks';
import { formatPlanLimit, formatPlanPeriod, formatPlanPrice } from '@/lib/planFormat';
import type { Plan } from '@/lib/types';
import { useDebounce } from '@/lib/useDebounce';
import { useDeletePlan, usePlans } from '../plans.hooks';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { MigratePlanDialog } from './MigratePlanDialog';

/** Plans with historical subscriptions cannot be deleted — say so before the request fails. */
function deletionWarning(plan: Plan | null): string {
  const totalSubscriberCount = plan?.totalSubscriberCount ?? 0;
  if (totalSubscriberCount === 0) return 'This cannot be undone. Tenants on this plan may be affected.';
  return `This plan has ${totalSubscriberCount} subscription record${
    totalSubscriberCount === 1 ? '' : 's'
  } tied to it, including past ones. Deleting will be rejected — deactivate the plan instead.`;
}

export function PlansView() {
  const { data, isLoading, isError, error, refetch } = usePlans();
  const deleteMutation = useDeletePlan();
  const canWrite = useCanWrite();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [planPendingDeletion, setPlanPendingDeletion] = useState<Plan | null>(null);
  const [planPendingMigration, setPlanPendingMigration] = useState<Plan | null>(null);

  // GET /admin/plans returns the full catalogue — filter + paginate client-side.
  const allPlans = data ?? [];
  const filteredPlans = search
    ? allPlans.filter(plan => plan.name.toLowerCase().includes(search.toLowerCase()))
    : allPlans;
  const pageRows = filteredPlans.slice((page - 1) * pageSize, page * pageSize);

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
                <span className="ms-1 text-xs text-default-500">· {totalSubscriberCount} total</span>
              )}
            </span>
          );
        },
      },
      ...(canWrite
        ? [
            {
              id: 'actions',
              header: '',
              enableHiding: false,
              cell: ({ row }) => (
                <div className="flex gap-1">
                  <Link
                    to={`/plans/${row.original.id}/edit`}
                    aria-label="Edit plan"
                    className={buttonVariants({ variant: 'soft', size: 'icon-sm' })}
                  >
                    <LuSquarePen className="size-4" />
                  </Link>
                  <Button
                    aria-label="Move subscribers to another plan"
                    variant="soft"
                    size="icon-sm"
                    onClick={() => setPlanPendingMigration(row.original)}
                  >
                    <LuArrowRightLeft className="size-4" />
                  </Button>
                  <Button
                    aria-label="Delete plan"
                    variant="soft-danger"
                    size="icon-sm"
                    onClick={() => setPlanPendingDeletion(row.original)}
                  >
                    <LuTrash2 className="size-4" />
                  </Button>
                </div>
              ),
            } satisfies ColumnDef<Plan, unknown>,
          ]
        : []),
    ],
    [canWrite]
  );

  return (
    <>
      <PageHeader
        title="Plans"
        description="Subscription plans & limits"
        action={
          canWrite ? (
            <Link to="/plans/new" className={buttonVariants({ size: 'sm' })}>
              <LuPlus className="size-4 me-1" /> New plan
            </Link>
          ) : undefined
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
        data={pageRows}
        total={filteredPlans.length}
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
        searchPlaceholder="Search plans…"
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        emptyMessage="No plans yet."
        getRowId={plan => plan.id}
      />
    </>
  );
}
