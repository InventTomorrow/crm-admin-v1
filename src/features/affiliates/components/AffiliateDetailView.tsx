import { useState } from 'react';
import {
  LuArrowLeft,
  LuBadgePercent,
  LuCircleCheck,
  LuHandCoins,
  LuLink2,
  LuLoaderCircle,
  LuMail,
  LuPencil,
  LuPhone,
  LuTrash2,
  LuUserPlus,
  LuWallet,
} from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router';
import { EmptyState, ErrorState, TenantDetailSkeleton } from '@/components/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { usePermissions } from '@/features/auth/auth.hooks';
import { DateRangeFilter } from '@/features/dashboard/components/DateRangeFilter';
import { rangeFromPreset, type Preset } from '@/features/dashboard/dashboard.hooks';
import { UserAvatar } from '@/features/users/components/UserAvatar';
import { formatDate, formatMoneyPKR } from '@/lib/format';
import { SystemPermissions } from '@/lib/permissions';
import {
  AFFILIATE_STATUS_LABEL,
  AFFILIATE_STATUS_TONE,
  formatPercent,
  percentChange,
} from '../affiliate-display';
import { useAffiliate, useAffiliateAnalytics } from '../affiliates.hooks';
import { DeleteAffiliateDialog } from './removal/DeleteAffiliateDialog';
import type { Affiliate, AffiliateAnalytics } from '../types';
import { AffiliateFormDialog } from './form/AffiliateFormDialog';
import { AffiliateJoinStatus } from './join/AffiliateJoinStatus';
import { AffiliateKpiTile } from './shared/AffiliateKpiTile';
import { PerformanceTrendChart, RevenueByPlanChart } from './analytics/AffiliateCharts';
import { CodePerformanceList } from './analytics/CodePerformanceList';
import { PayoutsPanel } from './payouts/PayoutsPanel';
import { RecordPayoutDialog } from './payouts/RecordPayoutDialog';
import { ReferralCodesPanel } from './codes/ReferralCodesPanel';
import { ReferralsTable } from './referrals/ReferralsTable';

type AffiliateTab = 'codes' | 'referrals' | 'payouts';

function AffiliateHeader({
  affiliate,
  canManage,
  onEdit,
  onDelete,
}: {
  affiliate: Affiliate;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="card overflow-hidden">
      <div className="h-20 bg-gradient-to-r from-primary/80 to-info/70" />
      <div className="card-body -mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="rounded-full bg-card p-1 shadow-sm">
              <UserAvatar
                firstName={affiliate.user?.firstName ?? affiliate.name}
                lastName={affiliate.user?.lastName ?? null}
                email={affiliate.email}
                avatarUrl={affiliate.user?.avatarUrl ?? null}
                className="size-16 text-xl"
              />
            </div>
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-default-900">{affiliate.name}</h1>
                <Badge tone={AFFILIATE_STATUS_TONE[affiliate.status]}>
                  {AFFILIATE_STATUS_LABEL[affiliate.status]}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-default-500">
                <span className="flex items-center gap-1.5">
                  <LuMail className="size-3.5" /> {affiliate.email}
                </span>
                {affiliate.phone && (
                  <span className="flex items-center gap-1.5">
                    <LuPhone className="size-3.5" /> {affiliate.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <LuBadgePercent className="size-3.5" /> {affiliate.commissionPercent}% commission
                </span>
                <span>
                  {affiliate.selfServeMaxDiscountPercent
                    ? `Can create own codes up to ${affiliate.selfServeMaxDiscountPercent}% off`
                    : 'Cannot create own codes'}
                </span>
                <span>Since {formatDate(affiliate.createdAt)}</span>
              </div>
              <div className="mt-2">
                <AffiliateJoinStatus affiliate={affiliate} canManage={canManage} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/affiliates')}>
              <LuArrowLeft className="size-4 me-1 rtl:rotate-180" /> All affiliates
            </Button>
            {canManage && (
              <>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <LuPencil className="size-4 me-1" /> Edit
                </Button>
                <Button variant="outline-danger" size="sm" onClick={onDelete}>
                  <LuTrash2 className="size-4 me-1" /> Delete
                </Button>
              </>
            )}
          </div>
        </div>
        {affiliate.notes && (
          <p className="mt-4 rounded-lg bg-default-150/60 px-3 py-2 text-sm text-default-600">
            {affiliate.notes}
          </p>
        )}
      </div>
    </div>
  );
}

function CommissionWalletCard({
  lifetime,
  canPayout,
  onPayout,
}: {
  lifetime: AffiliateAnalytics['lifetime'];
  canPayout: boolean;
  onPayout: () => void;
}) {
  return (
    <div className="flex h-full flex-col justify-between rounded-xl bg-gradient-to-r from-primary to-info p-5 text-white shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/75">Commission owed</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {formatMoneyPKR(lifetime.commissionOwed)}
          </p>
        </div>
        <span className="flex size-11 items-center justify-center rounded-lg bg-white/20">
          <LuWallet className="size-5" />
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-white/70">Earned all time</p>
          <p className="font-semibold tabular-nums">{formatMoneyPKR(lifetime.commissionEarned)}</p>
        </div>
        <div>
          <p className="text-white/70">Paid out</p>
          <p className="font-semibold tabular-nums">{formatMoneyPKR(lifetime.commissionPaid)}</p>
        </div>
      </div>
      {canPayout && (
        <button
          type="button"
          onClick={onPayout}
          disabled={lifetime.commissionOwed <= 0}
          className="btn btn-sm mt-4 w-full bg-white text-primary hover:bg-white/90 disabled:opacity-50"
        >
          <LuCircleCheck className="size-4 me-1" />
          {lifetime.commissionOwed > 0 ? 'Mark as paid' : 'Nothing owed'}
        </button>
      )}
    </div>
  );
}

function PerformanceSection({
  analytics,
  isFetching,
  canPayout,
  onPayout,
}: {
  analytics: AffiliateAnalytics;
  isFetching: boolean;
  canPayout: boolean;
  onPayout: () => void;
}) {
  const { totals, previousTotals, lifetime } = analytics;
  return (
    <div className="relative grid grid-cols-12 gap-5">
      {isFetching && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-body-bg/60">
          <LuLoaderCircle className="size-6 animate-spin text-primary" />
        </div>
      )}

      <div className="col-span-12 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:col-span-8 xl:grid-cols-3">
        <AffiliateKpiTile
          label="Sign-ups"
          value={totals.signups}
          icon={LuUserPlus}
          change={percentChange(totals.signups, previousTotals.signups)}
          hint={`${lifetime.signups} all time`}
        />
        <AffiliateKpiTile
          label="Paid accounts"
          value={totals.conversions}
          icon={LuCircleCheck}
          change={percentChange(totals.conversions, previousTotals.conversions)}
          hint={`${formatPercent(totals.conversionRate)} of these sign-ups paid`}
        />
        <AffiliateKpiTile
          label="Revenue brought in"
          value={formatMoneyPKR(totals.revenue)}
          icon={LuHandCoins}
          change={percentChange(totals.revenue, previousTotals.revenue)}
          hint={`${formatMoneyPKR(lifetime.revenue)} all time`}
        />
        <AffiliateKpiTile
          label="Discount given"
          value={formatMoneyPKR(totals.discountGiven)}
          icon={LuBadgePercent}
          change={percentChange(totals.discountGiven, previousTotals.discountGiven)}
        />
        <AffiliateKpiTile
          label="Commission earned"
          value={formatMoneyPKR(totals.commissionEarned)}
          icon={LuWallet}
          change={percentChange(totals.commissionEarned, previousTotals.commissionEarned)}
        />
        <AffiliateKpiTile
          label="Conversion rate"
          value={formatPercent(lifetime.conversionRate)}
          icon={LuLink2}
          hint={`${lifetime.conversions} of ${lifetime.signups} accounts paid, all time`}
        />
      </div>
      <div className="col-span-12 xl:col-span-4">
        <CommissionWalletCard lifetime={lifetime} canPayout={canPayout} onPayout={onPayout} />
      </div>

      <div className="col-span-12 xl:col-span-8">
        <div className="card h-full">
          <div className="card-header">
            <h6 className="card-title">Performance over time</h6>
          </div>
          <div className="card-body">
            <PerformanceTrendChart trend={analytics.trend} granularity={analytics.granularity} />
          </div>
        </div>
      </div>
      <div className="col-span-12 xl:col-span-4">
        <div className="card h-full">
          <div className="card-header">
            <h6 className="card-title">Revenue by plan</h6>
          </div>
          <div className="card-body">
            {analytics.byPlan.length === 0 ? (
              <EmptyState message="No paid referrals in this range." />
            ) : (
              <RevenueByPlanChart byPlan={analytics.byPlan} />
            )}
          </div>
        </div>
      </div>

      <div className="col-span-12">
        <div className="card">
          <div className="card-header">
            <h6 className="card-title">Code performance</h6>
          </div>
          <div className="card-body">
            <CodePerformanceList byCode={analytics.byCode} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AffiliateDetailView() {
  const { id: affiliateId = '' } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canManage = can(SystemPermissions.AFFILIATES_MANAGE);
  const canPayout = can(SystemPermissions.AFFILIATES_PAYOUT);

  const [preset, setPreset] = useState<Preset>('1m');
  const [range, setRange] = useState(() => rangeFromPreset(30));
  const [activeTab, setActiveTab] = useState<AffiliateTab>('codes');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);

  const affiliateQuery = useAffiliate(affiliateId);
  const analyticsQuery = useAffiliateAnalytics(affiliateId, range);

  if (affiliateQuery.isLoading) return <TenantDetailSkeleton />;
  if (affiliateQuery.isError || !affiliateQuery.data) {
    return (
      <div className="card">
        <ErrorState error={affiliateQuery.error} onRetry={affiliateQuery.refetch} />
      </div>
    );
  }

  const affiliate = affiliateQuery.data;
  const analytics = analyticsQuery.data;

  return (
    <div className="space-y-5">
      <AffiliateHeader
        affiliate={affiliate}
        canManage={canManage}
        onEdit={() => setIsEditOpen(true)}
        onDelete={() => setIsDeleteOpen(true)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-default-800">Performance</h2>
        <DateRangeFilter
          preset={preset}
          value={range}
          onChange={(nextRange, nextPreset) => {
            setRange(nextRange);
            setPreset(nextPreset);
          }}
        />
      </div>

      {analyticsQuery.isError ? (
        <div className="card">
          <ErrorState error={analyticsQuery.error} onRetry={analyticsQuery.refetch} />
        </div>
      ) : analytics ? (
        <PerformanceSection
          analytics={analytics}
          isFetching={analyticsQuery.isFetching}
          canPayout={canPayout}
          onPayout={() => setIsPayoutOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {['signups', 'paid', 'revenue'].map(placeholderKey => (
            <AffiliateKpiTile key={placeholderKey} label="" value="" icon={LuWallet} isLoading />
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <Tabs
            tabs={[
              { key: 'codes', label: 'Referral codes' },
              { key: 'referrals', label: 'Referred accounts', badge: analytics?.lifetime.signups },
              { key: 'payouts', label: 'Payouts' },
            ]}
            active={activeTab}
            onChange={tabKey => setActiveTab(tabKey as AffiliateTab)}
          />
          <div className="pt-4">
            {activeTab === 'codes' && (
              <ReferralCodesPanel affiliateId={affiliate.id} canManage={canManage} />
            )}
            {activeTab === 'referrals' && <ReferralsTable affiliateId={affiliate.id} />}
            {activeTab === 'payouts' && <PayoutsPanel affiliateId={affiliate.id} />}
          </div>
        </div>
      </div>

      <AffiliateFormDialog open={isEditOpen} onOpenChange={setIsEditOpen} affiliate={affiliate} />

      <RecordPayoutDialog
        open={isPayoutOpen}
        onOpenChange={setIsPayoutOpen}
        affiliateId={affiliate.id}
        affiliateName={affiliate.name}
        amountOwed={analytics?.lifetime.commissionOwed ?? 0}
      />

      <DeleteAffiliateDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        affiliate={affiliate}
        history={analytics?.lifetime ?? null}
        onRemoved={() => navigate('/affiliates')}
      />
    </div>
  );
}
