import { Link } from 'react-router';
import { LuCoins } from 'react-icons/lu';
import { LoadingState } from '@/components/states';
import { useCurrentPricing } from '@/features/ai-pricing/ai-pricing.hooks';

const MAX_ROWS = 5;

/** Snapshot of the most recently priced AI models — full history lives on the settings page. */
export function AiPricingWidget() {
  const { data: pricing, isLoading } = useCurrentPricing();

  if (isLoading) return <LoadingState />;

  const rows = (pricing ?? []).slice(0, MAX_ROWS);

  if (rows.length === 0) {
    return (
      <p className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-default-500">
        <LuCoins className="size-5 text-default-400" />
        No AI pricing entered yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-default-200">
      {rows.map(row => (
        <li key={row.id}>
          <Link
            to="/settings/ai-pricing"
            className="flex items-center justify-between gap-3 px-1 py-3 transition-colors hover:bg-primary/5"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-default-800">
                {row.model}
              </span>
              <span className="block truncate text-xs text-default-500">{row.provider}</span>
            </span>
            <span className="shrink-0 text-end text-sm tabular-nums text-default-700">
              ${row.inputPricePerMillionTokens.toFixed(2)}{' '}
              <span className="text-xs text-default-400">in</span> · $
              {row.outputPricePerMillionTokens.toFixed(2)}{' '}
              <span className="text-xs text-default-400">out</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
