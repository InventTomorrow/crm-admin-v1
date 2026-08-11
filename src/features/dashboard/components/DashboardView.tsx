import { useState } from 'react';
import {
  LuBuilding2,
  LuCreditCard,
  LuShieldCheck,
  LuTrendingUp,
  LuUserPlus,
  LuUsers,
  LuWallet,
} from 'react-icons/lu';
import { KpiCard } from '@/components/KpiCard';
import { PageHeader } from '@/components/PageHeader';
import { DashboardSkeleton, ErrorState } from '@/components/states';
import { formatMoneyPKR } from '@/lib/format';
import { cn } from '@/lib/utils';
import { DateRangeFilter } from './DateRangeFilter';
import { GrowthChart, TenantsByStatusChart, UsersDonutChart } from './charts';
import { rangeFromPreset, useMetrics, type Preset } from '../dashboard.hooks';

export function DashboardView() {
  const [preset, setPreset] = useState<Preset>('7d');
  const [range, setRange] = useState(() => rangeFromPreset(7));

  const { data, isLoading, isError, error, refetch, isFetching } = useMetrics(range);

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) {
    return (
      <div className="card">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  const activeTenants =
    data.tenantsByStatus.find(entry => entry.status === 'ACTIVE')?._count._all ?? 0;
  const suspendedTenants =
    data.tenantsByStatus.find(entry => entry.status === 'SUSPENDED')?._count._all ?? 0;
  const totalTenants = data.tenantsByStatus.reduce((sum, entry) => sum + entry._count._all, 0);
  const crmUsers = Math.max(0, data.totalUsers - data.systemUsers);

  return (
    <div className={cn('transition-opacity', isFetching && 'opacity-70')}>
      <PageHeader
        title="Dashboard"
        description="Platform overview"
        action={
          <DateRangeFilter
            preset={preset}
            value={range}
            onChange={(nextRange, nextPreset) => {
              setRange(nextRange);
              setPreset(nextPreset);
            }}
          />
        }
      />

      <div className="grid grid-cols-12 gap-5">
        {/* Range-scoped growth */}
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <KpiCard
            label="MRR"
            value={formatMoneyPKR(data.mrr)}
            sub={`${data.activeSubscriptions} active subscriptions`}
            icon={LuWallet}
            variant="brand"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <KpiCard
            label="New tenants"
            value={data.newTenants}
            sub="in selected range"
            icon={LuBuilding2}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <KpiCard
            label="New users"
            value={data.newUsers}
            sub="in selected range"
            icon={LuUserPlus}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <KpiCard
            label="New subscriptions"
            value={data.newSubscriptions}
            sub="in selected range"
            icon={LuTrendingUp}
          />
        </div>

        {/* Growth over time + user breakdown */}
        <div className="col-span-12 xl:col-span-8">
          <div className="card h-full">
            <div className="card-header">
              <h6 className="card-title">Growth over time</h6>
            </div>
            <div className="card-body">
              <GrowthChart series={data.series} />
            </div>
          </div>
        </div>
        <div className="col-span-12 xl:col-span-4">
          <div className="card h-full">
            <div className="card-header">
              <h6 className="card-title">User breakdown</h6>
            </div>
            <div className="card-body">
              <UsersDonutChart crmUsers={crmUsers} systemUsers={data.systemUsers} />
            </div>
          </div>
        </div>

        {/* Snapshots */}
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <KpiCard
            label="Tenants"
            value={totalTenants}
            sub={`${activeTenants} active · ${suspendedTenants} suspended`}
            icon={LuBuilding2}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <KpiCard label="Users" value={data.totalUsers} icon={LuUsers} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <KpiCard label="System users" value={data.systemUsers} icon={LuShieldCheck} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <KpiCard label="Plans" value={data.plans} icon={LuCreditCard} />
        </div>

        {/* Tenants by status */}
        <div className="col-span-12">
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Tenants by status</h6>
            </div>
            <div className="card-body">
              <TenantsByStatusChart tenantsByStatus={data.tenantsByStatus} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
