import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { LuDownload, LuTrash2 } from 'react-icons/lu';
import { PageHeader } from '@/components/PageHeader';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { usePermissions } from '@/features/auth/auth.hooks';
import { formatDate } from '@/lib/format';
import { SystemPermissions } from '@/lib/permissions';
import type { NewsletterSubscriberSortField } from '@/lib/types';
import { ExportDialog } from '@/components/ExportDialog';
import { datedFileName } from '@/lib/exportFileName';
import { useListQueryState } from '@/lib/useListQueryState';
import { useServerSorting } from '@/lib/useServerSorting';
import type { NewsletterSubscriber, NewsletterSubscriberStatus } from '../newsletter.api';
import {
  useDeleteSubscriber,
  useExportSubscribers,
  useNewsletterStats,
  useNewsletterSubscribers,
} from '../newsletter.hooks';

const STATUS_TONE: Record<NewsletterSubscriberStatus, BadgeTone> = {
  SUBSCRIBED: 'success',
  UNSUBSCRIBED: 'neutral',
};

const SUBSCRIBER_SORTABLE_COLUMNS: NewsletterSubscriberSortField[] = [
  'email',
  'status',
  'source',
  'createdAt',
];

export function SubscribersView() {
  const listQuery = useListQueryState({ filters: { status: 'ALL' }, defaultPageSize: 20 });
  const { page, pageSize, search, searchInput, filters } = listQuery;
  const statusFilter = filters.status as NewsletterSubscriberStatus | 'ALL';
  const [subscriberPendingDeletion, setSubscriberPendingDeletion] =
    useState<NewsletterSubscriber | null>(null);

  const { can } = usePermissions();
  const canDeleteSubscriber = can(SystemPermissions.NEWSLETTER_DELETE);

  const { sorting, onSortingChange, sortBy, sortOrder } =
    useServerSorting<NewsletterSubscriberSortField>({
      listQuery,
      sortableFields: SUBSCRIBER_SORTABLE_COLUMNS,
      defaultSort: { id: 'createdAt', desc: true },
    });

  const { data, isLoading, isFetching, isError, error, refetch } = useNewsletterSubscribers({
    page,
    limit: pageSize,
    sortBy,
    sortOrder,
    ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
    ...(search ? { search } : {}),
  });
  const { data: stats } = useNewsletterStats();
  const deleteMutation = useDeleteSubscriber();
  const exportMutation = useExportSubscribers();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const columns = useMemo<ColumnDef<NewsletterSubscriber, unknown>[]>(
    () => [
      {
        id: 'email',
        accessorFn: subscriber => subscriber.email,
        header: 'Email',
        cell: ({ row }) => <span className="font-medium">{row.original.email}</span>,
      },
      {
        id: 'status',
        accessorFn: subscriber => subscriber.status,
        header: 'Status',
        cell: ({ row }) => (
          <Badge tone={STATUS_TONE[row.original.status]}>{row.original.status}</Badge>
        ),
      },
      {
        id: 'source',
        accessorFn: subscriber => subscriber.source,
        header: 'Source',
        cell: ({ row }) => <span className="text-xs text-default-500">{row.original.source}</span>,
      },
      {
        id: 'createdAt',
        accessorFn: subscriber => subscriber.createdAt,
        header: 'Subscribed',
        cell: ({ row }) => (
          <span className="text-xs text-default-500">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableHiding: false,
        cell: ({ row }) =>
          canDeleteSubscriber ? (
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => setSubscriberPendingDeletion(row.original)}
            >
              <LuTrash2 className="size-4 me-1" /> Delete
            </Button>
          ) : null,
      },
    ],
    [canDeleteSubscriber]
  );

  const description = stats
    ? `${stats.subscribed} subscribed · ${stats.unsubscribed} unsubscribed`
    : 'Emails captured by the marketing site footer';

  return (
    <>
      <PageHeader
        title="Newsletter"
        description={description}
        action={
          can(SystemPermissions.NEWSLETTER_EXPORT) ? (
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(true)}
              disabled={exportMutation.isPending}
            >
              <LuDownload className="size-4 me-1" />
              Export CSV
            </Button>
          ) : undefined
        }
      />

      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        defaultFileName={datedFileName('newsletter-subscribers')}
        recordCount={stats?.subscribed ?? 0}
        recordLabel="subscribers"
        scopeDescription="every currently subscribed email"
        note="Unsubscribed emails are never exported, regardless of the filters above."
        isExporting={exportMutation.isPending}
        onExport={fileName =>
          exportMutation.mutate(fileName, { onSuccess: () => setIsExportDialogOpen(false) })
        }
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
        searchPlaceholder="Search by email…"
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        emptyMessage="No subscribers yet."
        getRowId={subscriber => subscriber.id}
        activeFilterCount={listQuery.activeCount}
        onResetFilters={listQuery.resetAll}
        toolbarFilters={
          <Select
            value={statusFilter}
            onChange={event => listQuery.setFilter('status', event.target.value)}
            className="form-input-sm w-40"
            aria-label="Filter by status"
          >
            <option value="ALL">All statuses</option>
            <option value="SUBSCRIBED">Subscribed</option>
            <option value="UNSUBSCRIBED">Unsubscribed</option>
          </Select>
        }
      />

      <ConfirmDialog
        open={subscriberPendingDeletion !== null}
        onOpenChange={isOpen => !isOpen && setSubscriberPendingDeletion(null)}
        title="Delete this subscriber?"
        description="The address is removed permanently. They can subscribe again from the site."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!subscriberPendingDeletion) return;
          deleteMutation.mutate(subscriberPendingDeletion.id, {
            onSuccess: () => setSubscriberPendingDeletion(null),
          });
        }}
      />
    </>
  );
}
