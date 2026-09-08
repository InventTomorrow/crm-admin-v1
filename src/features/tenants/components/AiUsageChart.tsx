import { useCallback } from 'react';
import type { ApexOptions } from 'apexcharts';
import ApexChartClient from '@/components/client-wrapper/ApexChartClient';
import { useChartColors } from '@/components/charts/useChartColors';
import type { TenantAiUsagePoint } from '@/lib/types';

/** Prompt vs. completion tokens per day over the selected range. */
export function AiUsageChart({ series }: { series: TenantAiUsagePoint[] }) {
  const chartColors = useChartColors();

  const categories = series.map(point => point.date.slice(5));
  const promptTokens = series.map(point => point.promptTokens);
  const completionTokens = series.map(point => point.completionTokens);

  const getOptions = useCallback(
    (): ApexOptions => ({
      chart: {
        type: 'area',
        toolbar: { show: false },
        foreColor: chartColors.foreground,
        zoom: { enabled: false },
        stacked: true,
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
      yaxis: { labels: { formatter: value => value.toLocaleString() } },
      tooltip: {
        theme: chartColors.mode,
        y: { formatter: value => `${value.toLocaleString()} tokens` },
      },
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
        { name: 'Prompt tokens', data: promptTokens },
        { name: 'Completion tokens', data: completionTokens },
      ]}
    />
  );
}
