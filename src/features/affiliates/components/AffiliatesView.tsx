import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  LuCircleCheck,
  LuHandCoins,
  LuHandshake,
  LuPencil,
  LuPlus,
  LuTrash2,
  LuWallet,
} from 'react-icons/lu';
import { useNavigate, useSearchParams } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { usePermissions } from '@/features/auth/auth.hooks';
import { UserAvatar } from '@/features/users/components/UserAvatar';
import { formatMoneyPKR } from '@/lib/format';
import { SystemPermissions } from '@/lib/permissions';
import { useListQueryState } from '@/lib/useListQueryState';
import { AFFILIATE_STATUS_LABEL, AFFILIATE_STATUS_TONE, formatPercent } from '../affiliate-display';
import {
  useAffiliateApplications,
  useAffiliates,
  useDeleteAffiliate,
  useProgramOverview,
} from '../affiliates.hooks';
import type { Affiliate, AffiliateListItem, AffiliateStatus } from '../types';
import { AffiliateFormDialog } from './form/AffiliateFormDialog';
import { AffiliateApplicationsPanel } from './applications/AffiliateApplicationsPanel';
import { AffiliateKpiTile } from './shared/AffiliateKpiTile';

const MAX_VISIBLE_CODES = 2;

function ProgramOverviewRow() {
  const { data: overview, isLoading } = useProgramOverview();
  return (
    <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <AffiliateKpiTile
        label="Active affiliates"
        value={overview?.activeAffiliates ?? 0}
        icon={LuHandshake}
        isLoading={isLoading}
      />
      <AffiliateKpiTile
        label="Referred accounts that paid"
        value={overview?.conversions ?? 0}
        icon={LuCircleCheck}
        hint={`${overview?.signups ?? 0} sign-ups · ${formatPercent(overview?.conversionRate ?? null)} paid`}
        isLoading={isLoading}
      />
      <AffiliateKpiTile
        label="Revenue from referrals"
        value={formatMoneyPKR(overview?.revenue ?? 0)}
        icon={LuHandCoins}
        isLoading={isLoading}
      />
      <AffiliateKpiTile
        label="Commission owed"
        value={formatMoneyPKR(overview?.commissionOwed ?? 0)}
        icon={LuWallet}
        hint={`${formatMoneyPKR(overview?.commissionEarned ?? 0)} earned all time`}
        isLoading={isLoading}
      />
    </div>
  );
}

type AffiliatesTab = 'affiliates' | 'applications';

export function AffiliatesView() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canManage = can(SystemPermissions.AFFILIATES_MANAGE);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: AffiliatesTab =
    searchParams.get('tab') === 'applications' ? 'applications' : 'affiliates';
  // Only the badge count is needed here; the panel runs its own paged query.
  const { data: pendingApplications } = useAffiliateApplications({
    page: 1,
    limit: 1,
    status: 'PENDING',
  });

  const switchTab = (tab: string) =>
    setSearchParams(currentParams => {
      const nextParams = new URLSearchParams(currentParams);
      if (tab === 'applications') nextParams.set('tab', tab);
      else nextParams.delete('tab');
      return nextParams;
    });

  const listQuery = useListQueryState({ filters: { status: 'ALL' } });
  const { page, pageSize, search, searchInput, filters } = listQuery;
  const statusFilter = filters.status as AffiliateStatus | 'ALL';

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [affiliateBeingEdited, setAffiliateBeingEdited] = useState<Affiliate | null>(null);
  const [affiliatePendingDeletion, setAffiliatePendingDeletion] =
    useState<AffiliateListItem | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useAffiliates({
    page,
    limit: pageSize,
    ...(search ? { search } : {}),
    ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
  });
  const deleteAffiliateMutation = useDeleteAffiliate();

  const openForm = (affiliate: Affiliate | null) => {
    setAffiliateBeingEdited(affiliate);
    setIsFormOpen(true);
  };

  const columns = useMemo<ColumnDef<AffiliateListItem, unknown>[]>(
    () => [
      {
        id: 'affiliate',
        header: 'Affiliate',
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar
              firstName={row.original.user?.firstName ?? row.original.name}
              lastName={row.original.user?.lastName ?? null}
              email={row.original.email}
              avatarUrl={row.original.user?.avatarUrl ?? null}
              className="size-9"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 truncate font-medium">
                {row.original.name}
                {row.original.user && <Badge tone="info">Linked</Badge>}
              </div>
              <div className="truncate text-xs text-default-500">{row.original.email}</div>
            </div>
          </div>
        ),
      },
      {
        id: 'codes',
        header: 'Codes',
        cell: ({ row }) => {
          const { codes } = row.original;
          if (codes.length === 0) return <span className="text-xs text-default-400">No codes</span>;
          return (
            <div className="flex flex-wrap items-center gap-1">
              {codes.slice(0, MAX_VISIBLE_CODES).map(referralCode => (
                <span
                  key={referralCode.id}
                  className="rounded-md border border-default-200 px-1.5 py-0.5 font-mono text-xs"
                >
                  {referralCode.code} · {referralCode.discountPercent}%
                </span>
              ))}
              {codes.length > MAX_VISIBLE_CODES && (
                <span className="text-xs text-default-400">
                  +{codes.length - MAX_VISIBLE_CODES}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'commission',
        header: 'Commission',
        cell: ({ row }) => <span className="tabular-nums">{row.original.commissionPercent}%</span>,
      },
      {
        id: 'referrals',
        header: 'Sign-ups / paid',
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.stats.signups}
            <span className="text-default-400"> / </span>
            <span className="font-medium text-success">{row.original.stats.conversions}</span>
          </span>
        ),
      },
      {
        id: 'revenue',
        header: 'Revenue',
        cell: ({ row }) => (
          <span className="tabular-nums">{formatMoneyPKR(row.original.stats.revenue)}</span>
        ),
      },
      {
        id: 'owed',
        header: 'Owed',
        cell: ({ row }) =>
          row.original.stats.commissionOwed > 0 ? (
            <span className="font-medium tabular-nums text-warning">
              {formatMoneyPKR(row.original.stats.commissionOwed)}
            </span>
          ) : (
            <span className="text-xs text-default-400">Settled</span>
          ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge tone={AFFILIATE_STATUS_TONE[row.original.status]}>
            {AFFILIATE_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      ...(canManage
        ? [
            {
              id: 'actions',
              header: 'Actions',
              enableHiding: false,
              cell: ({ row }) => (
                <div className="flex items-center gap-1" onClick={event => event.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit affiliate"
                    onClick={() => openForm(row.original)}
                  >
                    <LuPencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete affiliate"
                    className="hover:text-danger"
                    onClick={() => setAffiliatePendingDeletion(row.original)}
                  >
                    <LuTrash2 className="size-4" />
                  </Button>
                </div>
              ),
            } satisfies ColumnDef<AffiliateListItem, unknown>,
          ]
        : []),
    ],
    [canManage]
  );

  const hasHistory = (affiliatePendingDeletion?.stats.signups ?? 0) > 0;

  return (
    <>
      <PageHeader
        title="Affiliates"
        description="Partners who bring in customers with referral codes"
        action={
          canManage ? (
            <Button size="sm" onClick={() => openForm(null)}>
              <LuPlus className="size-4 me-1" /> Add affiliate
            </Button>
          ) : undefined
        }
      />

      <ProgramOverviewRow />

      <div className="mb-4">
        <Tabs
          tabs={[
            { key: 'affiliates', label: 'Affiliates' },
            {
              key: 'applications',
              label: 'Applications',
              badge: pendingApplications?.pendingCount || undefined,
            },
          ]}
          active={activeTab}
          onChange={switchTab}
        />
      </div>

      {activeTab === 'applications' ? (
        <AffiliateApplicationsPanel canManage={canManage} />
      ) : (
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
          searchPlaceholder="Search by name, email, phone or code…"
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          error={error}
          onRetry={refetch}
          emptyMessage="No affiliates yet."
          getRowId={affiliate => affiliate.id}
          onRowClick={affiliate => navigate(`/affiliates/${affiliate.id}`)}
          activeFilterCount={listQuery.activeCount}
          onResetFilters={listQuery.resetAll}
          toolbarFilters={
            <Select
              value={statusFilter}
              onChange={event => listQuery.setFilter('status', event.target.value)}
              className="form-input-sm w-36"
              aria-label="Filter by status"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
            </Select>
          }
        />
      )}

      <AffiliateFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        affiliate={affiliateBeingEdited}
        onCreated={createdAffiliate => navigate(`/affiliates/${createdAffiliate.id}`)}
      />

      <ConfirmDialog
        open={affiliatePendingDeletion !== null}
        onOpenChange={isOpen => !isOpen && setAffiliatePendingDeletion(null)}
        title={`Delete ${affiliatePendingDeletion?.name ?? 'affiliate'}?`}
        description={
          hasHistory
            ? 'This affiliate has referral history, so they will be archived instead: their codes stop working and their history stays in reports.'
            : 'This affiliate and their codes will be removed for good.'
        }
        confirmLabel={hasHistory ? 'Archive affiliate' : 'Delete affiliate'}
        isLoading={deleteAffiliateMutation.isPending}
        onConfirm={() => {
          if (!affiliatePendingDeletion) return;
          deleteAffiliateMutation.mutate(affiliatePendingDeletion.id, {
            onSuccess: () => setAffiliatePendingDeletion(null),
          });
        }}
      />
    </>
  );
}
