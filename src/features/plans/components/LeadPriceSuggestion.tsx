import { LuCheck } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { LeadPricingCalculatorButton } from '@/features/lead-pricing/components/LeadPricingCalculatorDialog';
import { useLeadPricingRates } from '@/features/lead-pricing/lead-pricing.hooks';
import { getLeadPlanQuote, isLeadPricedDuration } from '@/features/lead-pricing/lead-pricing.util';
import { isUnlimitedLimit, formatPlanPrice } from '@/lib/planFormat';
import type { PlanDuration } from '@/lib/types';

interface LeadPriceSuggestionProps {
  monthlyLeads: number;
  duration: PlanDuration;
  currency: string;
  currentPrice: number;
  onApplyPrice: (suggestedPrice: number) => void;
}

/** Suggested plan price from the saved lead rates; the admin decides whether to use it. */
export function LeadPriceSuggestion({
  monthlyLeads,
  duration,
  currency,
  currentPrice,
  onApplyPrice,
}: LeadPriceSuggestionProps) {
  const { data: leadPricingRates, isError } = useLeadPricingRates();
  if (isError || !leadPricingRates) return null;

  const renderNote = (note: string) => (
    <p className="rounded-lg border border-dashed border-default-200 px-4 py-3 text-sm text-default-500">
      {note}
    </p>
  );

  if (monthlyLeads <= 0 || isUnlimitedLimit(monthlyLeads)) {
    return renderNote('Set a lead count to get a suggested price.');
  }
  if (!isLeadPricedDuration(duration)) {
    return renderNote('Suggested prices cover monthly, quarterly, 6 month and annual billing.');
  }
  if (currency !== leadPricingRates.currency) {
    return renderNote(
      `Lead rates are in ${leadPricingRates.currency}, so no suggestion for a ${currency} plan.`
    );
  }

  const quote = getLeadPlanQuote(monthlyLeads, duration, leadPricingRates);
  const isApplied = currentPrice === quote.totalPrice;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-default-200 bg-default-50 px-4 py-3">
      <div className="min-w-0 text-sm">
        <p className="text-default-500">Suggested price</p>
        <p className="text-base font-semibold text-default-900">
          {formatPlanPrice(quote.totalPrice, currency)}
        </p>
        <p className="mt-0.5 text-xs text-default-500">
          ({monthlyLeads.toLocaleString('en-PK')} ×{' '}
          {formatPlanPrice(leadPricingRates.pricePerLead, currency)}
          {quote.baseFeePerMonth > 0 &&
            ` + ${formatPlanPrice(quote.baseFeePerMonth, currency)} base fee`}
          ) × {quote.months} {quote.months === 1 ? 'month' : 'months'}
          {quote.discountPercent > 0 && `, less ${quote.discountPercent}% long-term discount`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <LeadPricingCalculatorButton
          variant="ghost"
          label="Calculator"
          initialMonthlyLeads={monthlyLeads}
          initialDuration={duration}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isApplied}
          onClick={() => onApplyPrice(quote.totalPrice)}
        >
          {isApplied ? <LuCheck className="size-4 me-1" /> : null}
          {isApplied ? 'Price applied' : 'Use as plan price'}
        </Button>
      </div>
    </div>
  );
}
