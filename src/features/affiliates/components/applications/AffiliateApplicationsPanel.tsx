import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { LuCheck, LuExternalLink, LuX } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { formatDate } from '@/lib/format';
import { useListQueryState } from '@/lib/useListQueryState';
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE } from '../../affiliate-display';
import { useAffiliateApplications, useRejectAffiliateApplication } from '../../affiliates.hooks';
import type { AffiliateApplication, AffiliateApplicationStatus } from '../../types';
import { ApproveApplicationDialog } from './ApproveApplicationDialog';

export function AffiliateApplicationsPanel({ canManage }: { canManage: boolean }) {
  const navigate = useNavigate();
  const listQuery = useListQueryState({
    namespace: 'applications',
    filters: { status: 'PENDING' },
  });
  const { page, pageSize, search, searchInput, filters } = listQuery;
  const statusFilter = filters.status as AffiliateApplicationStatus | 'ALL';

  const [applicationBeingApproved, setApplicationBeingApproved] =
    useState<AffiliateApplication | null>(null);
  const [applicationBeingRejected, setApplicationBeingRejected] =
    useState<AffiliateApplication | null>(null);
  const rejectMutation = useRejectAffiliateApplication();

  const { data, isLoading, isFetching, isError, error, refetch } = useAffiliateApplications({
    page,
    limit: pageSize,
    ...(search ? { search } : {}),
    ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
  });

  const columns = useMemo<ColumnDef<AffiliateApplication, unknown>[]>(
    () => [
      {
        id: 'applicant',
        header: 'Applicant',
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.name}</div>
            <div className="truncate text-xs text-default-500">{row.original.email}</div>
            {row.original.phone && (
              <div className="truncate text-xs text-default-500">{row.original.phone}</div>
            )}
          </div>
        ),
      },
      {
        id: 'promotion',
        header: 'How they would promote',
        cell: ({ row }) => (
          <div className="max-w-md">
            <p className="line-clamp-2 text-sm text-default-700" title={row.original.message}>
              {row.original.message}
            </p>
            {row.original.website && /^https?:\/\//i.test(row.original.website) && (
              <a
                href={row.original.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={event => event.stopPropagation()}
              >
                {row.original.website} <LuExternalLink className="size-3" />
              </a>
            )}
          </div>
        ),
      },
      {
        id: 'submitted',
        header: 'Received',
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.createdAt)}</span>,
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge tone={APPLICATION_STATUS_TONE[row.original.status]}>
            {APPLICATION_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableHiding: false,
        cell: ({ row }) => {
          const { affiliateId, status } = row.original;
          if (status === 'APPROVED' && affiliateId) {
            return (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/affiliates/${affiliateId}`)}
              >
                Open affiliate
              </Button>
            );
          }
          if (status !== 'PENDING' || !canManage) return null;
          return (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="soft"
                onClick={() => setApplicationBeingApproved(row.original)}
              >
                <LuCheck className="size-3.5 me-1" /> Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="hover:text-danger"
                onClick={() => setApplicationBeingRejected(row.original)}
              >
                <LuX className="size-3.5 me-1" /> Reject
              </Button>
            </div>
          );
        },
      },
    ],
    [canManage, navigate]
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        total={data?.meta.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={listQuery.setPage}
        onPageSizeChange={listQuery.setPageSize}
        search={searchInput}
        onSearchChange={listQuery.setSearchInput}
        searchPlaceholder="Search by name, email or phone…"
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        emptyMessage={
          statusFilter === 'PENDING'
            ? 'No applications waiting for review.'
            : 'No applications yet.'
        }
        getRowId={application => application.id}
        activeFilterCount={listQuery.activeCount}
        onResetFilters={listQuery.resetAll}
        toolbarFilters={
          <Select
            value={statusFilter}
            onChange={event => listQuery.setFilter('status', event.target.value)}
            className="form-input-sm w-44"
            aria-label="Filter by status"
          >
            <option value="PENDING">{APPLICATION_STATUS_LABEL.PENDING}</option>
            <option value="APPROVED">{APPLICATION_STATUS_LABEL.APPROVED}</option>
            <option value="REJECTED">{APPLICATION_STATUS_LABEL.REJECTED}</option>
            <option value="ALL">All applications</option>
          </Select>
        }
      />

      <ApproveApplicationDialog
        application={applicationBeingApproved}
        onClose={() => setApplicationBeingApproved(null)}
      />

      <ConfirmDialog
        open={applicationBeingRejected !== null}
        onOpenChange={isOpen => !isOpen && setApplicationBeingRejected(null)}
        intent="warning"
        title={`Reject ${applicationBeingRejected?.name ?? 'this application'}?`}
        description="They are not notified. The application stays in the list as rejected."
        confirmLabel="Reject"
        isLoading={rejectMutation.isPending}
        onConfirm={() =>
          applicationBeingRejected &&
          rejectMutation.mutate(
            { applicationId: applicationBeingRejected.id },
            { onSuccess: () => setApplicationBeingRejected(null) }
          )
        }
      />
    </>
  );
}
