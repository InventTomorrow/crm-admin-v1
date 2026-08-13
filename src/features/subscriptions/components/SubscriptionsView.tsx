import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  LuCircleAlert,
  LuCircleCheck,
  LuCalendarOff,
  LuEllipsisVertical,
  LuHourglass,
  LuLayers,
  LuSettings2,
  LuTrash2,
} from 'react-icons/lu';
import { Select } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { KpiCard } from '@/components/KpiCard';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { useCanWrite } from '@/features/auth/auth.hooks';
import { formatFullName } from '@/lib/format';
import { formatPlanPrice } from '@/lib/planFormat';
import { SUBSCRIPTION_STATUS_TONE } from '@/lib/statusTones';
import type { Subscription, SubscriptionStatus } from '@/lib/types';
import { CreateSubscriptionDialog } from './CreateSubscriptionDialog';
import { ManageSubscriptionDialog } from './ManageSubscriptionDialog';
import { SubscriptionDetailSheet } from './SubscriptionDetailSheet';
import {
  useCancelSubscriptionAtPeriodEnd,
  useDeleteSubscription,
  useSubscriptions,
  useUpdateSubscriptionStatus,
} from '../subscriptions.hooks';

export function SubscriptionsView() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'ALL'>('ALL');
  const [subscriptionUnderReview, setSubscriptionUnderReview] = useState<Subscription | null>(null);
  const [subscriptionBeingManaged, setSubscriptionBeingManaged] = useState<Subscription | null>(null);
  const [subscriptionPendingDeletion, setSubscriptionPendingDeletion] =
    useState<Subscription | null>(null);
  const canWrite = useCanWrite();

  const { data, isLoading, isError, error, refetch } = useSubscriptions({
    page,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    limit: pageSize,
  });
  const statusMutation = useUpdateSubscriptionStatus();
  const cancelMutation = useCancelSubscriptionAtPeriodEnd();
  const deleteMutation = useDeleteSubscription();

  // KPI counts — lightweight parallel queries (limit:1 → meta.total only)
  const { data: totalData, isLoading: kpiLoading } = useSubscriptions({ page: 1, limit: 1 });
  const { data: activeData } = useSubscriptions({ page: 1, status: 'ACTIVE', limit: 1 });
  const { data: trialingData } = useSubscriptions({ page: 1, status: 'TRIALING', limit: 1 });
  const { data: pastDueData } = useSubscriptions({ page: 1, status: 'PAST_DUE', limit: 1 });

  const columns = useMemo<ColumnDef<Subscription, unknown>[]>(
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
        accessorFn: subscription => subscription.plan?.price ?? 0,
        header: 'Price',
        cell: ({ row }) =>
          row.original.plan
            ? formatPlanPrice(row.original.plan.price, row.original.plan.currency)
            : '—',
      },
      {
        id: 'status',
        accessorFn: subscription => subscription.status,
        header: 'Status',
        cell: ({ row }) => (
          <Badge tone={SUBSCRIPTION_STATUS_TONE[row.original.status]}>{row.original.status}</Badge>
        ),
      },
      ...(canWrite
        ? [
            {
              id: 'actions',
              header: 'Actions',
              enableHiding: false,
              cell: ({ row }) => {
                const subscription = row.original;
                const isLive =
                  subscription.status === 'ACTIVE' || subscription.status === 'TRIALING';
                return (
                  <span
                    className="flex items-center gap-1.5"
                    onClick={event => event.stopPropagation()}
                  >
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

                    <Dropdown
                      trigger={<LuEllipsisVertical className="size-4" />}
                      triggerLabel="Subscription actions"
                    >
                      <DropdownItem
                        icon={LuSettings2}
                        onSelect={() => setSubscriptionBeingManaged(subscription)}
                      >
                        Change plan / dates
                      </DropdownItem>
                      <DropdownItem
                        icon={LuCalendarOff}
                        // Only a live subscription has a period left to run out.
                        disabled={!isLive || !subscription.currentPeriodEnd}
                        onSelect={() => cancelMutation.mutate(subscription.id)}
                      >
                        Cancel at period end
                      </DropdownItem>
                      <DropdownItem
                        icon={LuTrash2}
                        destructive
                        onSelect={() => setSubscriptionPendingDeletion(subscription)}
                      >
                        Delete
                      </DropdownItem>
                    </Dropdown>
                  </span>
                );
              },
            } satisfies ColumnDef<Subscription, unknown>,
          ]
        : []),
    ],
    [statusMutation, cancelMutation, canWrite]
  );

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Tenant subscriptions & billing state"
        action={canWrite ? <CreateSubscriptionDialog /> : undefined}
      />

      {/* KPI cards */}
      <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Subscriptions"
          value={totalData?.meta.total}
          icon={LuLayers}
          variant="brand"
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
