import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/PageHeader';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { LeadPricingCalculatorButton } from '@/features/lead-pricing/components/LeadPricingCalculatorDialog';
import { LEAD_PRICED_DURATION_LABEL } from '@/features/lead-pricing/lead-pricing.util';
import { formatDate } from '@/lib/format';
import { formatPlanPrice } from '@/lib/planFormat';
import { useListQueryState } from '@/lib/useListQueryState';
import { useServerSorting } from '@/lib/useServerSorting';
import type {
  CustomPlanRequest,
  CustomPlanRequestSortField,
  CustomPlanRequestStatus,
} from '../custom-plan-requests.api';
import { useCustomPlanRequests } from '../custom-plan-requests.hooks';
import { ReviewCustomPlanRequestDialog } from './ReviewCustomPlanRequestDialog';

const STATUS_TONE: Record<CustomPlanRequestStatus, BadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

const SORTABLE_COLUMNS: CustomPlanRequestSortField[] = [
  'customer',
  'leads',
  'price',
  'submitted',
  'status',
];

export function CustomPlanRequestsView() {
  const listQuery = useListQueryState({ filters: { status: 'PENDING' } });
  const { page, pageSize, search, searchInput, filters } = listQuery;
  const statusFilter = filters.status as CustomPlanRequestStatus | 'ALL';
  const [requestUnderReview, setRequestUnderReview] = useState<CustomPlanRequest | null>(null);

  const { sorting, onSortingChange, sortBy, sortOrder } =
    useServerSorting<CustomPlanRequestSortField>({
      listQuery,
      sortableFields: SORTABLE_COLUMNS,
      defaultSort: { id: 'submitted', desc: true },
    });

  const { data, isLoading, isFetching, isError, error, refetch } = useCustomPlanRequests({
    page,
    limit: pageSize,
    sortBy,
    sortOrder,
    ...(search ? { search } : {}),
    ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
  });

  const columns = useMemo<ColumnDef<CustomPlanRequest, unknown>[]>(
    () => [
      {
        id: 'customer',
        header: 'Customer',
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium">
              {row.original.businessName ?? row.original.customerName}
            </div>
            <div className="truncate text-xs text-default-500">{row.original.customerEmail}</div>
          </div>
        ),
      },
      {
        id: 'leads',
        header: 'Leads / month',
        cell: ({ row }) => (
          <div>
            <div>{row.original.monthlyLeads.toLocaleString('en-PK')}</div>
            <div className="text-xs text-default-500">
              {row.original.monthlyMessages.toLocaleString('en-PK')} messages
            </div>
          </div>
        ),
      },
      {
        id: 'price',
        header: 'Quote',
        cell: ({ row }) => (
          <div>
            <div>{formatPlanPrice(row.original.quotedPrice, row.original.currency)}</div>
            <div className="text-xs text-default-500">
              {LEAD_PRICED_DURATION_LABEL[row.original.duration]}
            </div>
          </div>
        ),
      },
      {
        id: 'submitted',
        header: 'Submitted',
        cell: ({ row }) => (
          <span className="text-xs text-default-500">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge tone={STATUS_TONE[row.original.status]}>{row.original.status}</Badge>
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
            onClick={event => {
              event.stopPropagation();
              setRequestUnderReview(row.original);
            }}
          >
            {row.original.status === 'PENDING' ? 'Review' : 'View'}
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Custom plan requests"
        description="Plans visitors built with the public lead calculator, waiting for a checkout link"
        action={<LeadPricingCalculatorButton />}
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
        searchPlaceholder="Search by name, email, phone or business…"
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        emptyMessage="No custom plan requests found."
        getRowId={request => request.id}
        onRowClick={request => setRequestUnderReview(request)}
        activeFilterCount={listQuery.activeCount}
        onResetFilters={listQuery.resetAll}
        toolbarFilters={
          <Select
            value={statusFilter}
            onChange={event => listQuery.setFilter('status', event.target.value)}
            className="form-input-sm w-40"
            aria-label="Filter by status"
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ALL">All statuses</option>
          </Select>
        }
      />

      <ReviewCustomPlanRequestDialog
        request={requestUnderReview}
        open={requestUnderReview !== null}
        onClose={() => setRequestUnderReview(null)}
      />
    </>
  );
}
