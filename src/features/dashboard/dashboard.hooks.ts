import { useQuery } from '@tanstack/react-query';
import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import type { Metrics } from '@/lib/types';

export interface DateRange {
  from: string; // ISO
  to: string; // ISO
}

export type Preset = '3d' | '7d' | '1m' | '1y' | 'custom';

export function rangeFromPreset(days: number): DateRange {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

/** Metrics the API gained after the currently deployed server was cut. */
type LaterMetrics =
  | 'subscriptionRevenue'
  | 'subscriptionPayments'
  | 'lifetimeSubscriptionRevenue'
  | 'recentUsers';

/** What `/admin/metrics` actually sends — an older server omits the newer keys. */
type MetricsResponse = Omit<Metrics, LaterMetrics> & Partial<Pick<Metrics, LaterMetrics>>;

/**
 * Fills in whatever the server didn't send. Without this the dashboard crashes
 * outright on `recentUsers.length` the moment it talks to a server older than
 * the metrics work, taking the whole root page down with it.
 */
function withMissingMetricDefaults(response: MetricsResponse): Metrics {
  return {
    ...response,
    subscriptionRevenue: response.subscriptionRevenue ?? 0,
    subscriptionPayments: response.subscriptionPayments ?? 0,
    lifetimeSubscriptionRevenue: response.lifetimeSubscriptionRevenue ?? 0,
    recentUsers: response.recentUsers ?? [],
  };
}

async function getMetrics(range: DateRange): Promise<Metrics> {
  const { data } = await apiClient.get<ApiEnvelope<MetricsResponse>>('/admin/metrics', {
    params: range,
  });
  return withMissingMetricDefaults(data.data);
}

export function useMetrics(range: DateRange) {
  return useQuery({
    queryKey: ['metrics', range.from, range.to],
    queryFn: () => getMetrics(range),
    placeholderData: prev => prev,
  });
}
