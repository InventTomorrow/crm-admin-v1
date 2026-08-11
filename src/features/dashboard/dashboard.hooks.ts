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

async function getMetrics(range: DateRange): Promise<Metrics> {
  const { data } = await apiClient.get<ApiEnvelope<Metrics>>('/admin/metrics', { params: range });
  return data.data;
}

export function useMetrics(range: DateRange) {
  return useQuery({
    queryKey: ['metrics', range.from, range.to],
    queryFn: () => getMetrics(range),
    placeholderData: prev => prev,
  });
}
