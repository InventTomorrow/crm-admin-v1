import type { IconType } from 'react-icons/lib';
import { LuArrowDownRight, LuArrowUpRight, LuMinus } from 'react-icons/lu';
import { cn } from '@/lib/utils';

interface AffiliateKpiTileProps {
  label: string;
  value: string | number;
  icon: IconType;
  /** Percent change vs the previous period; null hides the pill. */
  change?: number | null;
  hint?: string;
  isLoading?: boolean;
}

function ChangePill({ change }: { change: number }) {
  const ChangeIcon = change > 0 ? LuArrowUpRight : change < 0 ? LuArrowDownRight : LuMinus;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums',
        change > 0 && 'bg-success/10 text-success',
        change < 0 && 'bg-danger/10 text-danger',
        change === 0 && 'bg-default-200 text-default-500'
      )}
    >
      <ChangeIcon className="size-3" />
      {Math.abs(change)}%
    </span>
  );
}

/** Stat tile with an optional change pill against the previous period. */
export function AffiliateKpiTile({
  label,
  value,
  icon: Icon,
  change,
  hint,
  isLoading,
}: AffiliateKpiTileProps) {
  return (
    <div className="h-full rounded-xl border border-default-200 bg-default-150/40 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        {change !== undefined && change !== null && !isLoading && <ChangePill change={change} />}
      </div>
      {isLoading ? (
        <div className="mt-4 space-y-2">
          <div className="h-6 w-24 animate-pulse rounded bg-default-200" />
          <div className="h-3.5 w-28 animate-pulse rounded bg-default-150" />
        </div>
      ) : (
        <>
          <p className="mt-4 truncate text-2xl font-semibold tabular-nums text-default-900">
            {value}
          </p>
          <p className="mt-0.5 truncate text-sm text-default-500">{label}</p>
          {hint && <p className="mt-1 truncate text-xs text-default-400">{hint}</p>}
        </>
      )}
    </div>
  );
}
