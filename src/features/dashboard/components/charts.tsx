import { useCallback } from 'react';
import type { ApexOptions } from 'apexcharts';
import ApexChartClient from '@/components/client-wrapper/ApexChartClient';
import { useChartColors } from '@/components/charts/useChartColors';
import type { Metrics, TenantStatus } from '@/lib/types';

/** Tenants + users growth over the selected range (smooth gradient areas). */
export function GrowthChart({ series }: { series: Metrics['series'] }) {
  const chartColors = useChartColors();

  const categories = series.map(point => point.date.slice(5));
  const tenantCounts = series.map(point => point.tenants);
  const userCounts = series.map(point => point.users);

  const getOptions = useCallback(
    (): ApexOptions => ({
      chart: {
        type: 'area',
        toolbar: { show: false },
        foreColor: chartColors.foreground,
        zoom: { enabled: false },
      },
      colors: [chartColors.primary, chartColors.info],
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
      },
      dataLabels: { enabled: false },
      grid: { borderColor: chartColors.border, strokeDashArray: 3 },
      legend: { position: 'bottom' },
      xaxis: {
        categories,
        tickAmount: Math.min(categories.length, 12),
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { formatter: value => String(Math.round(value)) } },
      tooltip: { theme: chartColors.mode },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- categories derives from series
    [chartColors, series]
  );

  return (
    <ApexChartClient
      type="area"
      height={280}
      getOptions={getOptions}
      series={[
        { name: 'Tenants', data: tenantCounts },
        { name: 'Users', data: userCounts },
      ]}
    />
  );
}

const STATUS_ORDER: TenantStatus[] = ['ACTIVE', 'SUSPENDED', 'CHURNED'];
const STATUS_LABEL: Record<TenantStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  CHURNED: 'Churned',
};

/** Per-status tenant counts as a distributed-color column chart. */
export function TenantsByStatusChart({
  tenantsByStatus,
}: {
  tenantsByStatus: Metrics['tenantsByStatus'];
}) {
  const chartColors = useChartColors();

  // Every status is always charted (zeros included) so the axis stays stable.
  const counts = STATUS_ORDER.map(
    status => tenantsByStatus.find(entry => entry.status === status)?._count._all ?? 0
  );
  const statusColor: Record<TenantStatus, string> = {
    ACTIVE: chartColors.success,
    SUSPENDED: chartColors.warning,
    CHURNED: chartColors.danger,
  };

  const getOptions = useCallback(
    (): ApexOptions => ({
      chart: { type: 'bar', toolbar: { show: false }, foreColor: chartColors.foreground },
      colors: STATUS_ORDER.map(status => statusColor[status]),
      plotOptions: {
        // Wide columns with no gap between them keeps the three bars reading as
        // one group instead of three lonely spikes across a full-width card.
        bar: { distributed: true, borderRadius: 4, columnWidth: '55%' },
      },
      states: { active: { filter: { type: 'none' } } },
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: { borderColor: chartColors.border, strokeDashArray: 3 },
      xaxis: {
        categories: STATUS_ORDER.map(status => STATUS_LABEL[status]),
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { formatter: value => String(Math.round(value)) } },
      tooltip: { theme: chartColors.mode },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- statusColor derives from chartColors
    [chartColors]
  );

  return (
    <div>
      <ApexChartClient
        type="bar"
        height={180}
        getOptions={getOptions}
        series={[{ name: 'Tenants', data: counts }]}
      />
      {/* Status dot legend */}
      <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-default-500">
        {STATUS_ORDER.map((status, statusIndex) => (
          <span key={status} className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: statusColor[status] }}
            />
            {STATUS_LABEL[status]} · {counts[statusIndex]}
          </span>
        ))}
      </div>
    </div>
  );
}

/** CRM vs system users donut. */
export function UsersDonutChart({
  crmUsers,
  systemUsers,
}: {
  crmUsers: number;
  systemUsers: number;
}) {
  const chartColors = useChartColors();

  const getOptions = useCallback(
    (): ApexOptions => ({
      chart: { type: 'donut', foreColor: chartColors.foreground },
      labels: ['CRM users', 'System users'],
      colors: [chartColors.primary, chartColors.info],
      dataLabels: { enabled: false },
      legend: { position: 'bottom' },
      stroke: { width: 0 },
      plotOptions: {
        pie: {
          donut: {
            size: '75%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total users',
                formatter: () => String(crmUsers + systemUsers),
              },
            },
          },
        },
      },
      tooltip: { theme: chartColors.mode },
    }),
    [chartColors, crmUsers, systemUsers]
  );

  return (
    <ApexChartClient
      type="donut"
      height={260}
      getOptions={getOptions}
      series={[crmUsers, systemUsers]}
    />
  );
}
