import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { UserAvatar } from '@/features/users/components/UserAvatar';
import { formatDate, formatFullName, formatMoneyPKR } from '@/lib/format';
import { useListQueryState } from '@/lib/useListQueryState';
import { REFERRAL_STATUS_LABEL, REFERRAL_STATUS_TONE } from '../../affiliate-display';
import { useAffiliateReferrals } from '../../affiliates.hooks';
import type { Referral, ReferralStatus } from '../../types';

export function ReferralsTable({ affiliateId }: { affiliateId: string }) {
  const listQuery = useListQueryState({ namespace: 'referrals', filters: { status: 'ALL' } });
  const { page, pageSize, filters } = listQuery;
  const statusFilter = filters.status as ReferralStatus | 'ALL';

  const { data, isLoading, isFetching, isError, error, refetch } = useAffiliateReferrals(
    affiliateId,
    {
      page,
      limit: pageSize,
      ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
    }
  );

  const columns = useMemo<ColumnDef<Referral, unknown>[]>(
    () => [
      {
        id: 'customer',
        header: 'Customer',
        cell: ({ row }) => {
          const customer = row.original.referredUser;
          return (
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar
                firstName={customer.firstName}
                lastName={customer.lastName}
                email={customer.email}
                avatarUrl={customer.avatarUrl}
                hasPaidPlan={row.original.status === 'CONVERTED'}
                className="size-8"
              />
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {formatFullName(customer.firstName, customer.lastName)}
                </div>
                <div className="truncate text-xs text-default-500">{customer.email}</div>
              </div>
            </div>
          );
        },
      },
      {
        id: 'code',
        header: 'Code',
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.code.code}
            <span className="ms-1.5 text-xs text-default-400">
              −{row.original.discountPercent}%
            </span>
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge tone={REFERRAL_STATUS_TONE[row.original.status]}>
            {REFERRAL_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      {
        id: 'plan',
        header: 'Plan',
        cell: ({ row }) =>
          row.original.planName ?? <span className="text-default-400">Not yet</span>,
      },
      {
        id: 'paid',
        header: 'Paid',
        cell: ({ row }) =>
          row.original.paidAmount === null ? (
            <span className="text-default-400">N/A</span>
          ) : (
            <div className="tabular-nums">
              <div>{formatMoneyPKR(row.original.paidAmount)}</div>
              {!!row.original.discountAmount && (
                <div className="text-xs text-default-400">
                  saved {formatMoneyPKR(row.original.discountAmount)}
                </div>
              )}
            </div>
          ),
      },
      {
        id: 'commission',
        header: 'Commission',
        cell: ({ row }) =>
          row.original.commissionAmount === null ? (
            <span className="text-default-400">N/A</span>
          ) : (
            <div className="flex items-center gap-2 tabular-nums">
              {formatMoneyPKR(row.original.commissionAmount)}
              <Badge tone={row.original.payout ? 'success' : 'warning'}>
                {row.original.payout ? 'Paid out' : 'Owed'}
              </Badge>
            </div>
          ),
      },
      {
        id: 'date',
        header: 'Joined / paid',
        cell: ({ row }) => (
          <div className="text-xs text-default-500">
            <div>{formatDate(row.original.createdAt)}</div>
            {row.original.convertedAt && (
              <div className="text-success">{formatDate(row.original.convertedAt)}</div>
            )}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      total={data?.meta.total ?? 0}
      page={page}
      pageSize={pageSize}
      onPageChange={listQuery.setPage}
      onPageSizeChange={listQuery.setPageSize}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      error={error}
      onRetry={refetch}
      emptyMessage="No referred accounts yet."
      getRowId={referral => referral.id}
      activeFilterCount={listQuery.activeCount}
      onResetFilters={listQuery.resetAll}
      toolbarFilters={
        <Select
          value={statusFilter}
          onChange={event => listQuery.setFilter('status', event.target.value)}
          className="form-input-sm w-40"
          aria-label="Filter by status"
        >
          <option value="ALL">All referrals</option>
          <option value="SIGNED_UP">Signed up</option>
          <option value="CONVERTED">Paid</option>
        </Select>
      }
    />
  );
}
