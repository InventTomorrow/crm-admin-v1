import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { LuBan, LuCopy } from 'react-icons/lu';
import { toast } from 'sonner';
import { Select } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/PageHeader';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { useCanWrite } from '@/features/auth/auth.hooks';
import { formatDate } from '@/lib/format';
import { CreateCheckoutLinkDialog } from './CreateCheckoutLinkDialog';
import type { CheckoutLink, CheckoutLinkStatus } from '../links.api';
import { useCheckoutLinks, useRevokeCheckoutLink } from '../links.hooks';
import { Button } from '@/components/ui/button';

const LINK_STATUS_TONE: Record<CheckoutLinkStatus, BadgeTone> = {
  ACTIVE: 'success',
  USED: 'neutral',
  REVOKED: 'danger',
  EXPIRED: 'warning',
};

export function LinksView() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<CheckoutLinkStatus | 'ALL'>('ALL');
  const [linkPendingRevocation, setLinkPendingRevocation] = useState<CheckoutLink | null>(null);
  const canWrite = useCanWrite();

  const { data, isLoading, isError, error, refetch } = useCheckoutLinks({
    page,
    limit: pageSize,
    ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
  });
  const revokeMutation = useRevokeCheckoutLink();

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  const columns = useMemo<ColumnDef<CheckoutLink, unknown>[]>(
    () => [
      {
        id: 'customer',
        accessorFn: link => (link.customerName ?? '').toLowerCase(),
        header: 'Sent to',
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.customerName ?? '—'}</div>
            <div className="truncate text-xs text-default-500">
              {row.original.customerEmail ?? 'no email'}
            </div>
          </div>
        ),
      },
      {
        id: 'account',
        accessorFn: link => link.owner?.email ?? '',
        header: 'Account',
        cell: ({ row }) =>
          row.original.owner?.email ?? <span className="text-xs text-default-500">Not linked</span>,
      },
      {
        id: 'plan',
        accessorFn: link => link.plan?.name ?? '',
        header: 'Plan',
        cell: ({ row }) => row.original.plan?.name ?? '—',
      },
      {
        id: 'expires',
        accessorFn: link => link.expiresAt,
        header: 'Expires',
        cell: ({ row }) => (
          <span className="text-xs text-default-500">{formatDate(row.original.expiresAt)}</span>
        ),
      },
      {
        id: 'status',
        accessorFn: link => link.status,
        header: 'Status',
        cell: ({ row }) => (
          <Badge tone={LINK_STATUS_TONE[row.original.status]}>{row.original.status}</Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => copyUrl(row.original.url)}>
              <LuCopy className="size-4 me-1" /> Copy
            </Button>
            {canWrite && row.original.status === 'ACTIVE' && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => setLinkPendingRevocation(row.original)}
              >
                <LuBan className="size-4 me-1" /> Revoke
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canWrite]
  );

  return (
    <>
      <PageHeader
        title="Checkout links"
        description="Single-use payment links sent to customers"
        action={canWrite ? <CreateCheckoutLinkDialog /> : undefined}
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
        emptyMessage="No checkout links yet."
        getRowId={link => link.id}
        toolbarFilters={
          <Select
            value={statusFilter}
            onChange={event => {
              setStatusFilter(event.target.value as CheckoutLinkStatus | 'ALL');
              setPage(1);
            }}
            className="form-input-sm w-40"
            aria-label="Filter by status"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="USED">Used</option>
            <option value="REVOKED">Revoked</option>
            <option value="EXPIRED">Expired</option>
          </Select>
        }
      />

      <ConfirmDialog
        open={linkPendingRevocation !== null}
        onOpenChange={isOpen => !isOpen && setLinkPendingRevocation(null)}
        title="Revoke this link?"
        description="The customer will no longer be able to use it. You can always send a new one."
        confirmLabel="Revoke"
        isLoading={revokeMutation.isPending}
        onConfirm={() => {
          if (!linkPendingRevocation) return;
          revokeMutation.mutate(linkPendingRevocation.id, {
            onSuccess: () => setLinkPendingRevocation(null),
          });
        }}
      />
    </>
  );
}
