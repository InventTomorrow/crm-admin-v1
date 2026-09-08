import { useState } from 'react';
import { LuBrackets, LuCoins, LuHash, LuMessageSquare, LuZap } from 'react-icons/lu';
import { KpiCard } from '@/components/KpiCard';
import { ErrorState, LoadingState } from '@/components/states';
import { Badge } from '@/components/ui/badge';
import { rangeFromPreset, type Preset } from '@/features/dashboard/dashboard.hooks';
import { DateRangeFilter } from '@/features/dashboard/components/DateRangeFilter';
import { useTenantAiUsage } from '../tenants.hooks';
import { AiUsageChart } from './AiUsageChart';

/** AI token usage for one tenant — range-filtered totals + a daily chart. */
export function TenantAiUsageView({ tenantId }: { tenantId: string }) {
  const [preset, setPreset] = useState<Preset>('1m');
  const [range, setRange] = useState(() => rangeFromPreset(30));

  const { data, isLoading, isError, error, refetch } = useTenantAiUsage(tenantId, range);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DateRangeFilter
          preset={preset}
          value={range}
          onChange={(nextRange, nextPreset) => {
            setRange(nextRange);
            setPreset(nextPreset);
          }}
        />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError || !data ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              label="Total tokens"
              value={data.totals.totalTokens.toLocaleString()}
              icon={LuZap}
              variant="brand"
              sub="in selected range"
            />
            <KpiCard
              label="Prompt tokens"
              value={data.totals.promptTokens.toLocaleString()}
              icon={LuBrackets}
              sub={`${data.totals.cachedTokens.toLocaleString()} cached`}
            />
            <KpiCard
              label="Completion tokens"
              value={data.totals.completionTokens.toLocaleString()}
              icon={LuHash}
              sub="output"
            />
            <KpiCard
              label="LLM calls"
              value={data.totals.calls.toLocaleString()}
              icon={LuMessageSquare}
              sub="in selected range"
            />
            <KpiCard
              label="Cost"
              value={`$${data.totalUsdCost.toFixed(2)}`}
              icon={LuCoins}
              sub={
                data.totalPkrCost === null
                  ? 'in selected range'
                  : `≈ Rs ${data.totalPkrCost.toFixed(0)}`
              }
            />
          </div>

          {data.hasUnpricedUsage && (
            <Badge tone="warning">
              Some usage has no price entered yet — its cost is excluded from the total above.
            </Badge>
          )}

          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Token usage over time</h6>
            </div>
            <div className="card-body">
              <AiUsageChart series={data.series} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Cost by model</h6>
            </div>
            <div className="card-body overflow-x-auto">
              <table className="min-w-full divide-y divide-default-200">
                <thead className="bg-default-150">
                  <tr className="text-sm font-normal text-default-700">
                    <th className="px-3.5 py-2.5 text-start">Model</th>
                    <th className="px-3.5 py-2.5 text-start">Prompt tokens</th>
                    <th className="px-3.5 py-2.5 text-start">Cached</th>
                    <th className="px-3.5 py-2.5 text-start">Completion tokens</th>
                    <th className="px-3.5 py-2.5 text-start">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default-200">
                  {data.costByModel.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3.5 py-4 text-sm text-default-500">
                        No AI usage in the selected range.
                      </td>
                    </tr>
                  )}
                  {data.costByModel.map(row => (
                    <tr key={`${row.provider}-${row.model}`} className="text-sm text-default-800">
                      <td className="px-3.5 py-2.5 font-medium">
                        {row.provider} / {row.model}
                      </td>
                      <td className="px-3.5 py-2.5 tabular-nums">
                        {row.promptTokens.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2.5 tabular-nums text-default-500">
                        {row.cachedTokens.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2.5 tabular-nums">
                        {row.completionTokens.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2.5 tabular-nums">
                        {row.usdCost === null ? (
                          <span className="text-default-400">No price entered</span>
                        ) : (
                          `$${row.usdCost.toFixed(4)}`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
