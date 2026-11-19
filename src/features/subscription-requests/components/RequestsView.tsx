import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/PageHeader';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { KpiCard } from '@/components/KpiCard';
import { buttonVariants } from '@/components/ui/button';
import { usePermissions } from '@/features/auth/auth.hooks';
import { useSubscriptionRevenue } from '@/features/subscriptions/subscriptions.hooks';
import { useMarkSectionSeen } from '@/lib/useSectionSeenAt';
import { formatDate, formatMoneyPKR } from '@/lib/format';
import { SystemPermissions } from '@/lib/permissions';
import { LuCircleCheck, LuHourglass, LuLandmark, LuTrendingUp, LuWallet } from 'react-icons/lu';
import { Link } from 'react-router';
import { formatPlanPrice } from '@/lib/planFormat';
import type { SubscriptionRequestSortField } from '@/lib/types';
import { useListQueryState } from '@/lib/useListQueryState';
import { useServerSorting } from '@/lib/useServerSorting';
import { PlanFilterSelect } from '@/features/plans/components/PlanFilterSelect';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '@/features/subscriptions/subscriptions.api';
import { ReviewRequestDialog } from './ReviewRequestDialog';
import type { SubscriptionRequest, SubscriptionRequestStatus } from '../requests.api';
import { useSubscriptionRequests } from '../requests.hooks';
import { Button } from '@/components/ui/button';

const REQUEST_STATUS_TONE: Record<SubscriptionRequestStatus, BadgeTone> = {
  PENDING_APPROVAL: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'neutral',
};

/** Workflow 2 queue — customer-submitted requests awaiting admin approval. */
const REQUEST_SORTABLE_COLUMNS: SubscriptionRequestSortField[] = [
  'customer',
  'account',
  'plan',
  'paid',
  'submitted',
  'status',
];

export function RequestsView() {
  useMarkSectionSeen('user-payments');
  // Status defaults to the queue that needs action, so it stays out of the URL
  // until the admin chooses something else.
  const listQuery = useListQueryState({
    filters: { status: 'PENDING_APPROVAL', planId: 'ALL', paymentMethod: 'ALL' },
  });
  const { page, pageSize, search, searchInput, filters } = listQuery;
  const statusFilter = filters.status as SubscriptionRequestStatus | 'ALL';
  const [requestUnderReview, setRequestUnderReview] = useState<SubscriptionRequest | null>(null);

  const { sorting, onSortingChange, sortBy, sortOrder } =
    useServerSorting<SubscriptionRequestSortField>({
      listQuery,
      sortableFields: REQUEST_SORTABLE_COLUMNS,
      defaultSort: { id: 'submitted', desc: true },
    });

  const { data, isLoading, isFetching, isError, error, refetch } = useSubscriptionRequests({
    page,
    limit: pageSize,
    sortBy,
    sortOrder,
    ...(search ? { search } : {}),
    ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
    ...(filters.planId === 'ALL' ? {} : { planId: filters.planId }),
    ...(filters.paymentMethod === 'ALL' ? {} : { paymentMethod: filters.paymentMethod }),
  });

  const { can } = usePermissions();
  // Revenue is guarded by subscriptions:view on the server, which not every reviewer holds.
  const canViewRevenue = can(SystemPermissions.SUBSCRIPTIONS_VIEW);
  const { data: revenue, isLoading: isRevenueLoading } = useSubscriptionRevenue({
    enabled: canViewRevenue,
  });
  const { data: pendingRequestsData, isLoading: isPendingCountLoading } = useSubscriptionRequests({
    page: 1,
    limit: 1,
    sortBy: 'submitted',
    sortOrder: 'desc',
    status: 'PENDING_APPROVAL',
  });

  const columns = useMemo<ColumnDef<SubscriptionRequest, unknown>[]>(
    () => [
      {
        id: 'customer',
        accessorFn: request => request.customerName.toLowerCase(),
        header: 'Customer',
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.customerName}</div>
            <div className="truncate text-xs text-default-500">{row.original.customerEmail}</div>
          </div>
        ),
      },
      {
        id: 'account',
        accessorFn: request => request.owner?.email ?? '',
        header: 'Account',
        cell: ({ row }) =>
          row.original.owner?.email ?? <span className="text-xs text-default-500">Not linked</span>,
      },
      {
        id: 'plan',
        accessorFn: request => request.plan?.name ?? '',
        header: 'Plan',
        cell: ({ row }) => row.original.plan?.name ?? 'N/A',
      },
      {
        id: 'paid',
        accessorFn: request => request.paymentAmount,
        header: 'Paid',
        cell: ({ row }) => (
          <div className="min-w-0">
            <div>{formatPlanPrice(row.original.paymentAmount, row.original.currency)}</div>
            <div className="text-xs text-default-500">
              {row.original.paymentMethod.replace(/_/g, ' ').toLowerCase()}
            </div>
          </div>
        ),
      },
      {
        id: 'submitted',
        accessorFn: request => request.createdAt,
        header: 'Submitted',
        cell: ({ row }) => (
          <span className="text-xs text-default-500">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'status',
        accessorFn: request => request.status,
        header: 'Status',
        cell: ({ row }) => (
          <Badge tone={REQUEST_STATUS_TONE[row.original.status]}>
            {row.original.status.replace(/_/g, ' ')}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableHiding: false,
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            // The row itself opens the dialog; stop the bubble so this doesn't
            // fire the same handler twice.
            onClick={event => {
              event.stopPropagation();
              setRequestUnderReview(row.original);
            }}
          >
            {row.original.status === 'PENDING_APPROVAL' ? 'Review' : 'View'}
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="User payments"
        description="Payments customers submitted from checkout, awaiting your approval"
        action={
          can(SystemPermissions.SETTINGS_VIEW) ? (
            <Link
              to="/payment-accounts"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <LuLandmark className="size-4" />
              Payment accounts
            </Link>
          ) : undefined
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Awaiting approval"
          value={pendingRequestsData?.meta.total}
          icon={LuHourglass}
          variant="brand"
          isLoading={isPendingCountLoading}
          sub="payments to review"
        />
        {canViewRevenue && (
          <>
            <KpiCard
              label="Revenue collected"
              value={formatMoneyPKR(revenue?.collected)}
              icon={LuWallet}
              isLoading={isRevenueLoading}
              sub={revenue ? `${revenue.payments} payments` : 'plan payments only'}
            />
            <KpiCard
              label="MRR"
              value={formatMoneyPKR(revenue?.mrr)}
              icon={LuTrendingUp}
              isLoading={isRevenueLoading}
              sub="from live subscriptions"
            />
            <KpiCard
              label="Live subscriptions"
              value={revenue?.activeSubscriptions}
              icon={LuCircleCheck}
              isLoading={isRevenueLoading}
              sub="active and trialing"
            />
          </>
        )}
      </div>

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
        searchPlaceholder="Search by customer, email or reference…"
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        emptyMessage="No user payments found."
        getRowId={request => request.id}
        onRowClick={request => setRequestUnderReview(request)}
        activeFilterCount={listQuery.activeCount}
        onResetFilters={listQuery.resetAll}
        toolbarFilters={
          <>
            <Select
              value={statusFilter}
              onChange={event => listQuery.setFilter('status', event.target.value)}
              className="form-input-sm w-44"
              aria-label="Filter by status"
            >
              <option value="PENDING_APPROVAL">Pending approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
              <option value="ALL">All statuses</option>
            </Select>
            <PlanFilterSelect
              value={filters.planId}
              onChange={planId => listQuery.setFilter('planId', planId)}
            />
            <Select
              value={filters.paymentMethod}
              onChange={event => listQuery.setFilter('paymentMethod', event.target.value)}
              className="form-input-sm w-40"
              aria-label="Filter by payment method"
            >
              <option value="ALL">All methods</option>
              {PAYMENT_METHODS.map(method => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </option>
              ))}
            </Select>
          </>
        }
      />

      <ReviewRequestDialog
        request={requestUnderReview}
        open={requestUnderReview !== null}
        onClose={() => setRequestUnderReview(null)}
      />
    </>
  );
}
