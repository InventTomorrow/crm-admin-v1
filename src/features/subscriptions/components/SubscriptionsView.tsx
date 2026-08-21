import { useMemo, useState } from 'react';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
  LuCircleAlert,
  LuCircleCheck,
  LuCalendarOff,
  LuEllipsisVertical,
  LuHourglass,
  LuLandmark,
  LuLayers,
  LuSettings2,
  LuTrash2,
  LuWallet,
} from 'react-icons/lu';
import { Link } from 'react-router';
import { Select } from '@/components/ui/select';
import { buttonVariants } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { KpiCard } from '@/components/KpiCard';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/features/auth/auth.hooks';
import { SystemPermissions } from '@/lib/permissions';
import { formatDate, formatFullName, formatMoneyPKR } from '@/lib/format';
import { SUBSCRIPTION_STATUS_TONE } from '@/lib/statusTones';
import type { SubscriptionListItem, SubscriptionSortField, SubscriptionStatus } from '@/lib/types';
import { CreateSubscriptionDialog } from './CreateSubscriptionDialog';
import { ManageSubscriptionDialog } from './ManageSubscriptionDialog';
import { SubscriptionDetailSheet } from './SubscriptionDetailSheet';
import { SubscriptionPlanPriceCell, SubscriptionPriceCell } from './SubscriptionPriceCell';
import {
  useCancelSubscriptionAtPeriodEnd,
  useDeleteSubscription,
  useSubscriptionRevenue,
  useSubscriptions,
  useUpdateSubscriptionStatus,
} from '../subscriptions.hooks';

/** Column ids double as the server's sort keys, so the two can never drift. */
const SORTABLE_COLUMNS: SubscriptionSortField[] = [
  'account',
  'plan',
  'price',
  'paid',
  'status',
  'currentPeriodEnd',
];

export function SubscriptionsView() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'ALL'>('ALL');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [subscriptionUnderReview, setSubscriptionUnderReview] =
    useState<SubscriptionListItem | null>(null);
  const [subscriptionBeingManaged, setSubscriptionBeingManaged] =
    useState<SubscriptionListItem | null>(null);
  const [subscriptionPendingDeletion, setSubscriptionPendingDeletion] =
    useState<SubscriptionListItem | null>(null);
  const { can, canAny } = usePermissions();
  const canEditSubscription = can(SystemPermissions.SUBSCRIPTIONS_EDIT);
  const canCancelSubscription = can(SystemPermissions.SUBSCRIPTIONS_CANCEL);
  const canDeleteSubscription = can(SystemPermissions.SUBSCRIPTIONS_DELETE);

  const activeSort = sorting[0];
  const sortBy = (
    activeSort && SORTABLE_COLUMNS.includes(activeSort.id as SubscriptionSortField)
      ? activeSort.id
      : 'createdAt'
  ) as SubscriptionSortField;
  const sortOrder = activeSort?.desc === false ? 'asc' : 'desc';

  const { data, isLoading, isError, error, refetch } = useSubscriptions({
    page,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    limit: pageSize,
    sortBy,
    sortOrder,
  });
  const statusMutation = useUpdateSubscriptionStatus();
  const cancelMutation = useCancelSubscriptionAtPeriodEnd();
  const deleteMutation = useDeleteSubscription();

  // KPI counts — lightweight parallel queries (limit:1 → meta.total only)
  const { data: totalData, isLoading: kpiLoading } = useSubscriptions({ page: 1, limit: 1 });
  const { data: activeData } = useSubscriptions({ page: 1, status: 'ACTIVE', limit: 1 });
  const { data: trialingData } = useSubscriptions({ page: 1, status: 'TRIALING', limit: 1 });
  const { data: pastDueData } = useSubscriptions({ page: 1, status: 'PAST_DUE', limit: 1 });
  const { data: revenue, isLoading: revenueLoading } = useSubscriptionRevenue();

  const columns = useMemo<ColumnDef<SubscriptionListItem, unknown>[]>(
    () => [
      {
        id: 'account',
        accessorFn: subscription => subscription.owner?.email ?? '',
        header: 'Account',
        cell: ({ row }) => {
          const ownerName = formatFullName(
            row.original.owner?.firstName ?? null,
            row.original.owner?.lastName ?? null
          );
          return (
            <div className="min-w-0">
              <div className="truncate font-medium">
                {ownerName === '—' ? (row.original.owner?.email ?? '—') : ownerName}
              </div>
              <div className="truncate text-xs text-default-500">
                {row.original.owner?.email ?? ''}
              </div>
            </div>
          );
        },
      },
      {
        id: 'plan',
        accessorFn: subscription => subscription.plan?.name ?? '',
        header: 'Plan',
        cell: ({ row }) => row.original.plan?.name ?? '—',
      },
      {
        id: 'price',
        accessorFn: subscription => subscription.billing.planPrice,
        header: 'Plan price',
        cell: ({ row }) => <SubscriptionPlanPriceCell billing={row.original.billing} />,
      },
      {
        id: 'paid',
        accessorFn: subscription => subscription.billing.paidAmount ?? 0,
        header: 'Paid',
        cell: ({ row }) => <SubscriptionPriceCell billing={row.original.billing} />,
      },
      {
        id: 'status',
        accessorFn: subscription => subscription.status,
        header: 'Status',
        cell: ({ row }) => (
          <Badge tone={SUBSCRIPTION_STATUS_TONE[row.original.status]}>{row.original.status}</Badge>
        ),
      },
      {
        id: 'currentPeriodEnd',
        accessorFn: subscription => subscription.currentPeriodEnd ?? '',
        header: 'Renews / ends',
        cell: ({ row }) => (
          <span className="text-default-500">{formatDate(row.original.currentPeriodEnd)}</span>
        ),
      },
      ...(canAny(
        SystemPermissions.SUBSCRIPTIONS_EDIT,
        SystemPermissions.SUBSCRIPTIONS_CANCEL,
        SystemPermissions.SUBSCRIPTIONS_DELETE
      )
        ? [
            {
              id: 'actions',
              header: 'Actions',
              enableHiding: false,
              enableSorting: false,
              cell: ({ row }) => {
                const subscription = row.original;
                const isLive =
                  subscription.status === 'ACTIVE' || subscription.status === 'TRIALING';
                return (
                  <span
                    className="flex items-center gap-1.5"
                    onClick={event => event.stopPropagation()}
                  >
                    {canEditSubscription && (
                      <Select
                        value={subscription.status}
                        onChange={event =>
                          statusMutation.mutate({
                            id: subscription.id,
                            status: event.target.value as SubscriptionStatus,
                          })
                        }
                        className="form-input-sm w-32"
                        aria-label="Change subscription status"
                      >
                        <option value="TRIALING">Trialing</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PAST_DUE">Past due</option>
                        <option value="CANCELLED">Cancelled</option>
                      </Select>
                    )}

                    <Dropdown
                      trigger={<LuEllipsisVertical className="size-4" />}
                      triggerLabel="Subscription actions"
                    >
                      {canEditSubscription && (
                        <DropdownItem
                          icon={LuSettings2}
                          onSelect={() => setSubscriptionBeingManaged(subscription)}
                        >
                          Change plan / dates
                        </DropdownItem>
                      )}
                      {canCancelSubscription && (
                        <DropdownItem
                          icon={LuCalendarOff}
                          // Only a live subscription has a period left to run out.
                          disabled={!isLive || !subscription.currentPeriodEnd}
                          onSelect={() => cancelMutation.mutate(subscription.id)}
                        >
                          Cancel at period end
                        </DropdownItem>
                      )}
                      {canDeleteSubscription && (
                        <DropdownItem
                          icon={LuTrash2}
                          destructive
                          onSelect={() => setSubscriptionPendingDeletion(subscription)}
                        >
                          Delete
                        </DropdownItem>
                      )}
                    </Dropdown>
                  </span>
                );
              },
            } satisfies ColumnDef<SubscriptionListItem, unknown>,
          ]
        : []),
    ],
    [
      statusMutation,
      cancelMutation,
      canAny,
      canEditSubscription,
      canCancelSubscription,
      canDeleteSubscription,
    ]
  );

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description={
          revenue
            ? `${revenue.activeSubscriptions} live · ${formatMoneyPKR(revenue.collected)} collected`
            : 'Tenant subscriptions & billing state'
        }
        action={
          <div className="flex items-center gap-2">
            {can(SystemPermissions.SETTINGS_VIEW) && (
              <Link
                to="/payment-accounts"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                <LuLandmark className="size-4" />
                Payment accounts
              </Link>
            )}
            {can(SystemPermissions.SUBSCRIPTIONS_CREATE) && <CreateSubscriptionDialog />}
          </div>
        }
      />

      {/* KPI cards — revenue first, since it is the figure the page is judged on */}
      <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Subscription revenue"
          value={formatMoneyPKR(revenue?.collected)}
          icon={LuWallet}
          variant="brand"
          isLoading={revenueLoading}
          sub={
            revenue
              ? `${revenue.payments} payments · MRR ${formatMoneyPKR(revenue.mrr)}`
              : 'plan payments only'
          }
        />
        <KpiCard
          label="Total Subscriptions"
          value={totalData?.meta.total}
          icon={LuLayers}
          isLoading={kpiLoading}
          sub="all billing states"
        />
        <KpiCard
          label="Active"
          value={activeData?.meta.total}
          icon={LuCircleCheck}
          isLoading={kpiLoading}
          sub="paying subscribers"
        />
        <KpiCard
          label="Trialing"
          value={trialingData?.meta.total}
          icon={LuHourglass}
          isLoading={kpiLoading}
          sub="on a free trial"
        />
        <KpiCard
          label="Past Due"
          value={pastDueData?.meta.total}
          icon={LuCircleAlert}
          isLoading={kpiLoading}
          sub="payment overdue"
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
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        emptyMessage="No subscriptions found."
        getRowId={subscription => subscription.id}
        onRowClick={subscription => setSubscriptionUnderReview(subscription)}
        toolbarFilters={
          <Select
            value={statusFilter}
            onChange={event => {
              setStatusFilter(event.target.value as SubscriptionStatus | 'ALL');
              setPage(1);
            }}
            className="form-input-sm w-40"
            aria-label="Filter by status"
          >
            <option value="ALL">All statuses</option>
            <option value="TRIALING">Trialing</option>
            <option value="ACTIVE">Active</option>
            <option value="PAST_DUE">Past due</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        }
      />

      <SubscriptionDetailSheet
        subscription={subscriptionUnderReview}
        open={subscriptionUnderReview !== null}
        onClose={() => setSubscriptionUnderReview(null)}
      />

      <ManageSubscriptionDialog
        subscription={subscriptionBeingManaged}
        open={subscriptionBeingManaged !== null}
        onClose={() => setSubscriptionBeingManaged(null)}
      />

      <ConfirmDialog
        open={subscriptionPendingDeletion !== null}
        onOpenChange={isOpen => !isOpen && setSubscriptionPendingDeletion(null)}
        title="Delete this subscription?"
        description={
          subscriptionPendingDeletion
            ? `${subscriptionPendingDeletion.owner?.email ?? 'This account'} loses access to every workspace immediately, and their WhatsApp bot stops replying. Payments are kept but detached. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete subscription"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!subscriptionPendingDeletion) return;
          deleteMutation.mutate(subscriptionPendingDeletion.id, {
            onSuccess: () => setSubscriptionPendingDeletion(null),
          });
        }}
      />
    </>
  );
}
