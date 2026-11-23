import { useState } from 'react';
import { LuCalculator } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { isUnlimitedLimit } from '@/lib/planFormat';
import type { PlanDuration } from '@/lib/types';
import { isLeadPricedDuration } from '../lead-pricing.util';
import { LeadPricingCalculator } from './LeadPricingCalculator';

interface LeadPricingCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMonthlyLeads?: number;
  initialDuration?: PlanDuration;
}

export function LeadPricingCalculatorDialog({
  open,
  onOpenChange,
  initialMonthlyLeads,
  initialDuration,
}: LeadPricingCalculatorDialogProps) {
  // The plan form can hold 0 or Unlimited leads, or a trial duration; the calculator ignores those.
  const hasUsableLeads =
    initialMonthlyLeads !== undefined &&
    initialMonthlyLeads > 0 &&
    !isUnlimitedLimit(initialMonthlyLeads);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="2xl"
      title={
        <span className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LuCalculator className="size-4" />
          </span>
          Plan price calculator
        </span>
      }
    >
      <LeadPricingCalculator
        {...(hasUsableLeads ? { initialMonthlyLeads } : {})}
        {...(initialDuration && isLeadPricedDuration(initialDuration) ? { initialDuration } : {})}
      />
    </Modal>
  );
}

interface LeadPricingCalculatorButtonProps {
  initialMonthlyLeads?: number;
  initialDuration?: PlanDuration;
  label?: string;
  variant?: 'outline' | 'ghost';
}

/** Opens the calculator over the current page, so nothing the admin typed is lost. */
export function LeadPricingCalculatorButton({
  initialMonthlyLeads,
  initialDuration,
  label = 'Price calculator',
  variant = 'outline',
}: LeadPricingCalculatorButtonProps) {
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  return (
    <>
      <Button type="button" variant={variant} size="sm" onClick={() => setIsCalculatorOpen(true)}>
        <LuCalculator className="size-4 me-1" /> {label}
      </Button>
      <LeadPricingCalculatorDialog
        open={isCalculatorOpen}
        onOpenChange={setIsCalculatorOpen}
        {...(initialMonthlyLeads !== undefined ? { initialMonthlyLeads } : {})}
        {...(initialDuration ? { initialDuration } : {})}
      />
    </>
  );
}
