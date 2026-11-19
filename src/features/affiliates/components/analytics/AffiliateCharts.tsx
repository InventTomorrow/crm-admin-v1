import { useCallback } from 'react';
import type { ApexOptions } from 'apexcharts';
import ApexChartClient from '@/components/client-wrapper/ApexChartClient';
import { useChartColors } from '@/components/charts/useChartColors';
import { formatMoneyPKR } from '@/lib/format';
import type { AffiliateAnalytics } from '../../types';

const MONTH_LABEL = new Intl.DateTimeFormat('en', { month: 'short', year: '2-digit' });
const DAY_LABEL = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });

function bucketLabel(bucket: string, granularity: AffiliateAnalytics['granularity']): string {
  const bucketDate = new Date(
    granularity === 'day' ? `${bucket}T00:00:00` : `${bucket}-01T00:00:00`
  );
  return granularity === 'day' ? DAY_LABEL.format(bucketDate) : MONTH_LABEL.format(bucketDate);
}

/** Revenue as columns on the right axis, sign-ups and paid conversions as lines on the left. */
export function PerformanceTrendChart({
  trend,
  granularity,
}: Pick<AffiliateAnalytics, 'trend' | 'granularity'>) {
  const chartColors = useChartColors();
  const categories = trend.map(point => bucketLabel(point.bucket, granularity));

  const getOptions = useCallback(
    (): ApexOptions => ({
      chart: {
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
        foreColor: chartColors.foreground,
      },
      colors: [chartColors.info, chartColors.success, chartColors.primary],
      stroke: { curve: 'smooth', width: [2.5, 2.5, 0] },
      fill: { opacity: [1, 1, 0.35] },
      plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
      dataLabels: { enabled: false },
      grid: { borderColor: chartColors.border, strokeDashArray: 3 },
      legend: { position: 'bottom' },
      markers: { size: 0, hover: { size: 4 } },
      xaxis: {
        categories,
        tickAmount: Math.min(categories.length, 12),
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: [
        {
          seriesName: 'Sign-ups',
          title: { text: 'Accounts' },
          labels: { formatter: value => String(Math.round(value)) },
        },
        { seriesName: 'Sign-ups', show: false },
        {
          seriesName: 'Revenue',
          opposite: true,
          title: { text: 'Revenue' },
          labels: { formatter: value => formatMoneyPKR(Math.round(value)) },
        },
      ],
      tooltip: { theme: chartColors.mode, shared: true, intersect: false },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- categories derives from trend
    [chartColors, trend, granularity]
  );

  return (
    <ApexChartClient
      type="line"
      height={300}
      getOptions={getOptions}
      series={[
        { name: 'Sign-ups', type: 'line', data: trend.map(point => point.signups) },
        { name: 'Paid', type: 'line', data: trend.map(point => point.conversions) },
        { name: 'Revenue', type: 'column', data: trend.map(point => point.revenue) },
      ]}
    />
  );
}

/** Share of referred revenue per plan. */
export function RevenueByPlanChart({ byPlan }: Pick<AffiliateAnalytics, 'byPlan'>) {
  const chartColors = useChartColors();
  const palette = [
    chartColors.primary,
    chartColors.success,
    chartColors.info,
    chartColors.warning,
    chartColors.danger,
  ];
  const totalRevenue = byPlan.reduce((total, plan) => total + plan.revenue, 0);

  const getOptions = useCallback(
    (): ApexOptions => ({
      chart: { type: 'donut', foreColor: chartColors.foreground },
      labels: byPlan.map(plan => plan.planName),
      colors: byPlan.map((_, planIndex) => palette[planIndex % palette.length]),
      dataLabels: { enabled: false },
      legend: { position: 'bottom' },
      stroke: { width: 0 },
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Revenue',
                formatter: () => formatMoneyPKR(totalRevenue),
              },
            },
          },
        },
      },
      tooltip: { theme: chartColors.mode, y: { formatter: value => formatMoneyPKR(value) } },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- palette derives from chartColors
    [chartColors, byPlan, totalRevenue]
  );

  return (
    <ApexChartClient
      type="donut"
      height={280}
      getOptions={getOptions}
      series={byPlan.map(plan => plan.revenue)}
    />
  );
}
