import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { LuMail, LuPhone, LuTrash2 } from 'react-icons/lu';
import { PageHeader } from '@/components/PageHeader';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { Sheet } from '@/components/ui/sheet';
import { usePermissions } from '@/features/auth/auth.hooks';
import { formatDate, formatDateTime } from '@/lib/format';
import { SystemPermissions } from '@/lib/permissions';
import { useDebounce } from '@/lib/useDebounce';
import type { ContactMessage, ContactMessageStatus } from '../contact-messages.api';
import {
  useContactMessages,
  useContactMessageStats,
  useDeleteContactMessage,
  useUpdateContactMessageStatus,
} from '../contact-messages.hooks';

const STATUS_TONE: Record<ContactMessageStatus, BadgeTone> = {
  NEW: 'info',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
};

const STATUS_LABEL: Record<ContactMessageStatus, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
};

export function ContactMessagesView() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<ContactMessageStatus | 'ALL'>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [openedMessage, setOpenedMessage] = useState<ContactMessage | null>(null);
  const [messagePendingDeletion, setMessagePendingDeletion] = useState<ContactMessage | null>(null);
  const search = useDebounce(searchInput, 350);

  const { can } = usePermissions();
  const canManageMessage = can(SystemPermissions.CONTACT_MESSAGES_MANAGE);
  const canDeleteMessage = can(SystemPermissions.CONTACT_MESSAGES_DELETE);

  const { data, isLoading, isError, error, refetch } = useContactMessages({
    page,
    limit: pageSize,
    ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
    ...(search ? { search } : {}),
  });
  const { data: stats } = useContactMessageStats();
  const statusMutation = useUpdateContactMessageStatus();
  const deleteMutation = useDeleteContactMessage();

  const columns = useMemo<ColumnDef<ContactMessage, unknown>[]>(
    () => [
      {
        id: 'name',
        accessorFn: message => message.name,
        header: 'From',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            <span className="text-xs text-default-500">{row.original.email}</span>
          </div>
        ),
      },
      {
        id: 'subject',
        accessorFn: message => message.subject,
        header: 'Subject',
        cell: ({ row }) => (
          <button
            type="button"
            className="max-w-xs truncate text-start font-medium text-primary hover:underline"
            onClick={() => setOpenedMessage(row.original)}
          >
            {row.original.subject}
          </button>
        ),
      },
      {
        id: 'status',
        accessorFn: message => message.status,
        header: 'Status',
        cell: ({ row }) => (
          <Badge tone={STATUS_TONE[row.original.status]}>{STATUS_LABEL[row.original.status]}</Badge>
        ),
      },
      {
        id: 'createdAt',
        accessorFn: message => message.createdAt,
        header: 'Received',
        cell: ({ row }) => (
          <span className="text-xs text-default-500">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpenedMessage(row.original)}>
              Read
            </Button>
            {canDeleteMessage && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => setMessagePendingDeletion(row.original)}
              >
                <LuTrash2 className="size-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canDeleteMessage]
  );

  const description = stats
    ? `${stats.isNew} new · ${stats.inProgress} in progress · ${stats.resolved} resolved`
    : 'Messages sent from the marketing site contact form';

  return (
    <>
      <PageHeader title="Contact messages" description={description} />

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
        search={searchInput}
        onSearchChange={value => {
          setSearchInput(value);
          setPage(1);
        }}
        searchPlaceholder="Search by name, email or subject…"
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        emptyMessage="No messages yet."
        getRowId={message => message.id}
        toolbarFilters={
          <Select
            value={statusFilter}
            onChange={event => {
              setStatusFilter(event.target.value as ContactMessageStatus | 'ALL');
              setPage(1);
            }}
            className="form-input-sm w-40"
            aria-label="Filter by status"
          >
            <option value="ALL">All statuses</option>
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
          </Select>
        }
      />

      <Sheet
        open={openedMessage !== null}
        onOpenChange={isOpen => !isOpen && setOpenedMessage(null)}
        size="lg"
        title={openedMessage?.subject}
        description={
          openedMessage ? `${openedMessage.name} · ${formatDateTime(openedMessage.createdAt)}` : null
        }
      >
        {openedMessage && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={STATUS_TONE[openedMessage.status]}>
                {STATUS_LABEL[openedMessage.status]}
              </Badge>
              <span className="text-xs text-default-500">Source: {openedMessage.source}</span>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <a
                href={`mailto:${openedMessage.email}`}
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <LuMail className="size-4" /> {openedMessage.email}
              </a>
              {openedMessage.phone && (
                <a
                  href={`tel:${openedMessage.phone}`}
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <LuPhone className="size-4" /> {openedMessage.phone}
                </a>
              )}
            </div>

            <p className="whitespace-pre-wrap rounded-md bg-default-50 p-4 text-sm leading-relaxed text-default-700">
              {openedMessage.message}
            </p>

            {canManageMessage && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-default-600" htmlFor="message-status">
                  Change status
                </label>
                <Select
                  id="message-status"
                  value={openedMessage.status}
                  disabled={statusMutation.isPending}
                  onChange={event => {
                    const status = event.target.value as ContactMessageStatus;
                    statusMutation.mutate(
                      { id: openedMessage.id, status },
                      { onSuccess: updated => setOpenedMessage(updated) }
                    );
                  }}
                  className="w-48"
                  aria-label="Change status"
                >
                  <option value="NEW">New</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="RESOLVED">Resolved</option>
                </Select>
              </div>
            )}
          </div>
        )}
      </Sheet>

      <ConfirmDialog
        open={messagePendingDeletion !== null}
        onOpenChange={isOpen => !isOpen && setMessagePendingDeletion(null)}
        title="Delete this message?"
        description="The message is removed permanently and cannot be recovered."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!messagePendingDeletion) return;
          deleteMutation.mutate(messagePendingDeletion.id, {
            onSuccess: () => setMessagePendingDeletion(null),
          });
        }}
      />
    </>
  );
}
