import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/PageHeader';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
import { formatPlanPrice } from '@/lib/planFormat';
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
export function RequestsView() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Defaults to the queue that needs action.
  const [statusFilter, setStatusFilter] = useState<SubscriptionRequestStatus | 'ALL'>(
    'PENDING_APPROVAL'
  );
  const [requestUnderReview, setRequestUnderReview] = useState<SubscriptionRequest | null>(null);

  const { data, isLoading, isError, error, refetch } = useSubscriptionRequests({
    page,
    limit: pageSize,
    ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
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
        cell: ({ row }) => row.original.plan?.name ?? '—',
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
        title="Subscription requests"
        description="Customer-submitted payments awaiting approval"
      />

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
        emptyMessage="No subscription requests found."
        getRowId={request => request.id}
        onRowClick={request => setRequestUnderReview(request)}
        toolbarFilters={
          <Select
            value={statusFilter}
            onChange={event => {
              setStatusFilter(event.target.value as SubscriptionRequestStatus | 'ALL');
              setPage(1);
            }}
            className="form-input-sm w-44"
            aria-label="Filter by status"
          >
            <option value="PENDING_APPROVAL">Pending approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
            <option value="ALL">All statuses</option>
          </Select>
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
