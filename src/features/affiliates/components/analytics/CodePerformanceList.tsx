import { EmptyState } from '@/components/states';
import { Badge } from '@/components/ui/badge';
import { formatMoneyPKR } from '@/lib/format';
import type { CodePerformance } from '../../types';

/** Each code's range revenue as a bar relative to the best performer. */
export function CodePerformanceList({ byCode }: { byCode: CodePerformance[] }) {
  if (byCode.length === 0) return <EmptyState message="No codes yet." />;
  const topRevenue = Math.max(...byCode.map(codeStats => codeStats.revenue), 1);

  return (
    <ul className="space-y-4">
      {byCode.map(codeStats => (
        <li key={codeStats.codeId}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-default-800">
                {codeStats.code}
              </span>
              <span className="text-xs text-default-400">−{codeStats.discountPercent}%</span>
              {codeStats.isDeleted && <Badge tone="neutral">Retired</Badge>}
            </div>
            <span className="text-sm font-medium tabular-nums text-default-800">
              {formatMoneyPKR(codeStats.revenue)}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-default-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-info"
              style={{ width: `${Math.round((codeStats.revenue / topRevenue) * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-default-500">
            {codeStats.signups} sign-ups · {codeStats.conversions} paid ·{' '}
            {formatMoneyPKR(codeStats.commission)} commission
          </p>
        </li>
      ))}
    </ul>
  );
}
