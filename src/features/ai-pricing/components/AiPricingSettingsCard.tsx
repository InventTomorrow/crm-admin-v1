import { PermissionGuard } from '@/components/PermissionGuard';
import { LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { formatDate, formatMoneyPKR } from '@/lib/format';
import { SystemPermissions } from '@/lib/permissions';
import { useState } from 'react';
import { LuCalculator, LuCoins, LuHistory, LuPencil, LuPlus } from 'react-icons/lu';
import { useCurrentPricing, useExchangeRate } from '../ai-pricing.hooks';
import { AiAddPricingDialog } from './AiAddPricingDialog';
import { AiCostCalculatorDialog } from './AiCostCalculatorDialog';
import { AiExchangeRateDialog } from './AiExchangeRateDialog';
import { AiPricingHistorySheet } from './AiPricingHistorySheet';

/**
 * Per-model $/1M-token rates (input/cached/output) and the USD→PKR rate used to
 * show AI cost across tenants and users. No provider exposes a pricing API, so
 * every number here is manually entered — this card doubles as the "what's
 * currently on file" confirmation view.
 */
export function AiPricingSettingsCard() {
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [addPricingOpen, setAddPricingOpen] = useState(false);
  const [exchangeRateOpen, setExchangeRateOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<{ provider: string; model: string } | null>(
    null
  );

  const { data: pricing, isLoading: pricingLoading } = useCurrentPricing();
  const { data: exchangeRate, isLoading: rateLoading } = useExchangeRate();

  return (
    <div className="card py-4">
      <div className="card-header flex items-start justify-between gap-3">
        <h6 className="card-title flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LuCoins className="size-4" />
          </span>
          AI model pricing
        </h6>
        <Button type="button" variant="outline" size="sm" onClick={() => setCalculatorOpen(true)}>
          <LuCalculator className="size-4 me-1.5" /> Cost calculator
        </Button>
      </div>
      <div className="card-body space-y-6">
        <p className="text-sm text-default-500">
          No provider publishes a pricing API rates below are entered here manually and used to cost
          every tenant's AI usage. Adding a price never edits an existing one: it's a new rate
          effective from now, so past usage still costs at the rate that was active then.
        </p>

        {pricingLoading ? (
          <LoadingState />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-default-200">
              <thead className="bg-default-150">
                <tr className="text-sm font-normal text-default-700">
                  <th className="px-3.5 py-3 text-start">Model</th>
                  <th className="px-3.5 py-3 text-start">Input $/1M</th>
                  <th className="px-3.5 py-3 text-start">Cached input $/1M</th>
                  <th className="px-3.5 py-3 text-start">Output $/1M</th>
                  <th className="px-3.5 py-3 text-start">Effective from</th>
                  <th className="px-3.5 py-3 text-end">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-200">
                {(pricing ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3.5 py-4 text-sm text-default-500">
                      No pricing entered yet.
                    </td>
                  </tr>
                )}
                {pricing?.map(row => (
                  <tr key={row.id} className="text-sm text-default-800">
                    <td className="px-3.5 py-3 font-medium">
                      {row.provider} / {row.model}
                    </td>
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
                    <td className="px-3.5 py-3 text-default-500">
                      {formatDate(row.effectiveFrom)}
                    </td>
                    <td className="px-3.5 py-3 text-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setHistoryTarget({ provider: row.provider, model: row.model })
                        }
                      >
                        <LuHistory className="size-4 me-1.5" /> History
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <PermissionGuard permission={SystemPermissions.SETTINGS_EDIT}>
          <div className="border-t border-default-200 pt-4">
            <Button type="button" size="sm" onClick={() => setAddPricingOpen(true)}>
              <LuPlus className="size-4 me-1.5" /> Add a price
            </Button>
          </div>
        </PermissionGuard>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default-200 pt-4">
          <div>
            <p className="text-sm font-medium text-default-800">USD → PKR rate</p>
            <p className="mt-0.5 text-sm text-default-500">
              {rateLoading ? '…' : formatMoneyPKR(exchangeRate)}
            </p>
          </div>
          <PermissionGuard permission={SystemPermissions.SETTINGS_EDIT}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExchangeRateOpen(true)}
            >
              <LuPencil className="size-4 me-1.5" /> Edit rate
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <AiCostCalculatorDialog
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
        availableModels={pricing ?? []}
      />

      <AiAddPricingDialog
        open={addPricingOpen}
        onOpenChange={setAddPricingOpen}
        availableModels={pricing ?? []}
      />

      <AiExchangeRateDialog
        open={exchangeRateOpen}
        onOpenChange={setExchangeRateOpen}
        currentRate={exchangeRate ?? null}
      />

      {historyTarget && (
        <AiPricingHistorySheet
          open={!!historyTarget}
          onOpenChange={open => {
            if (!open) setHistoryTarget(null);
          }}
          provider={historyTarget.provider}
          model={historyTarget.model}
        />
      )}
    </div>
  );
}
