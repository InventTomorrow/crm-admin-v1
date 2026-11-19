import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { formatDate } from '@/lib/format';
import { formatPlanPrice } from '@/lib/planFormat';
import type { InvoiceListItem, InvoiceStatus } from '@/lib/types';
import { useListQueryState } from '@/lib/useListQueryState';
import { useInvoices } from '../invoices.hooks';
import { INVOICE_STATUS_LABEL } from '../invoice-status';
import { InvoiceRowActions } from './InvoiceRowActions';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

const ALL_STATUSES = 'ALL';
const FILTERABLE_STATUSES: InvoiceStatus[] = ['PAID', 'OPEN', 'VOID', 'UNCOLLECTIBLE', 'DRAFT'];

interface InvoicesTableProps {
  ownerUserId: string;
  onRecordPayment?: (invoice: InvoiceListItem) => void;
}

export function InvoicesTable({ ownerUserId, onRecordPayment }: InvoicesTableProps) {
  const listQuery = useListQueryState({ filters: { status: ALL_STATUSES }, namespace: 'invoices' });
  const { page, pageSize, filters } = listQuery;
  const statusFilter = filters.status as InvoiceStatus | typeof ALL_STATUSES;

  const invoicesQuery = useInvoices({
    ownerUserId,
    page,
    limit: pageSize,
    ...(statusFilter === ALL_STATUSES ? {} : { status: statusFilter }),
  });

  const columns = useMemo<ColumnDef<InvoiceListItem, unknown>[]>(
    () => [
      {
        id: 'invoice',
        header: 'Invoice',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-mono text-xs font-semibold text-default-800">
              {row.original.number}
            </p>
            <p className="truncate text-xs text-default-500">
              {row.original.planName ?? 'Subscription'}
            </p>
          </div>
        ),
      },
      {
        id: 'issuedAt',
        header: 'Issued',
        enableSorting: false,
        cell: ({ row }) => (
          <div>
            <p className="text-default-600">{formatDate(row.original.issuedAt)}</p>
            {row.original.status === 'OPEN' && row.original.dueAt && (
              <p className="text-xs text-default-500">Due {formatDate(row.original.dueAt)}</p>
            )}
          </div>
        ),
      },
      {
        id: 'period',
        header: 'Billing period',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.periodStart || row.original.periodEnd ? (
            <span className="text-default-600">
              {formatDate(row.original.periodStart)} to {formatDate(row.original.periodEnd)}
            </span>
          ) : (
            <span className="text-default-400">N/A</span>
          ),
      },
      {
        id: 'payment',
        header: 'Paid with',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.payment ? (
            <div className="min-w-0">
              <p className="text-default-700">{row.original.payment.methodLabel}</p>
              {row.original.payment.reference && (
                <p className="truncate text-xs text-default-500">
                  {row.original.payment.reference}
                </p>
              )}
            </div>
          ) : (
            <span className="text-default-400">N/A</span>
          ),
      },
      {
        id: 'amount',
        header: 'Amount',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums text-default-800">
            {formatPlanPrice(row.original.amount, row.original.currency)}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <InvoiceRowActions invoice={row.original} onRecordPayment={onRecordPayment} />
        ),
      },
    ],
    [onRecordPayment]
  );

  return (
    <DataTable
      columns={columns}
      data={invoicesQuery.data?.items ?? []}
      total={invoicesQuery.data?.meta.total ?? 0}
      page={page}
      pageSize={pageSize}
      onPageChange={listQuery.setPage}
      onPageSizeChange={listQuery.setPageSize}
      isLoading={invoicesQuery.isLoading}
      isFetching={invoicesQuery.isFetching}
      isError={invoicesQuery.isError}
      error={invoicesQuery.error}
      onRetry={invoicesQuery.refetch}
      emptyMessage="No invoices yet. Create one to bill this account."
      getRowId={invoice => invoice.id}
      activeFilterCount={listQuery.activeCount}
      onResetFilters={listQuery.resetAll}
      toolbarFilters={
        <Select
          value={statusFilter}
          onChange={event => listQuery.setFilter('status', event.target.value)}
          className="form-input-sm w-40"
          aria-label="Filter by invoice status"
        >
          <option value={ALL_STATUSES}>All statuses</option>
          {FILTERABLE_STATUSES.map(status => (
            <option key={status} value={status}>
              {INVOICE_STATUS_LABEL[status]}
            </option>
          ))}
        </Select>
      }
    />
  );
}
