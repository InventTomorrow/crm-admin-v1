import { LoadingState } from '@/components/states';
import { Badge } from '@/components/ui/badge';
import { Sheet } from '@/components/ui/sheet';
import { formatDate } from '@/lib/format';
import { usePricingHistory } from '../ai-pricing.hooks';

/** Every price ever entered for one provider+model, newest first — the newest row is the active one. */
export function AiPricingHistorySheet({
  open,
  onOpenChange,
  provider,
  model,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: string;
  model: string;
}) {
  const { data: history, isLoading } = usePricingHistory(provider, model, open);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Price history"
      description={`${provider} / ${model}`}
      size="lg"
    >
      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-default-200">
            <thead className="bg-default-150">
              <tr className="text-sm font-normal text-default-700">
                <th className="px-3.5 py-3 text-start">Input $/1M</th>
                <th className="px-3.5 py-3 text-start">Cached input $/1M</th>
                <th className="px-3.5 py-3 text-start">Output $/1M</th>
                <th className="px-3.5 py-3 text-start">Effective from</th>
                <th className="px-3.5 py-3 text-start">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-200">
              {(history ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3.5 py-4 text-sm text-default-500">
                    No pricing entered yet.
                  </td>
                </tr>
              )}
              {history?.map((row, index) => (
                <tr key={row.id} className="text-sm text-default-800">
                  <td className="px-3.5 py-3 tabular-nums">
                    ${row.inputPricePerMillionTokens.toFixed(2)}
                  </td>
                  <td className="px-3.5 py-3 tabular-nums text-default-500">
                    {row.cachedInputPricePerMillionTokens === null
                      ? '—'
                      : `$${row.cachedInputPricePerMillionTokens.toFixed(2)}`}
                  </td>
                  <td className="px-3.5 py-3 tabular-nums">
                    ${row.outputPricePerMillionTokens.toFixed(2)}
                  </td>
                  <td className="px-3.5 py-3 text-default-500">{formatDate(row.effectiveFrom)}</td>
                  <td className="px-3.5 py-3">
                    {index === 0 ? (
                      <Badge tone="primary">Active</Badge>
                    ) : (
                      <span className="text-default-400">Past</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Sheet>
  );
}
