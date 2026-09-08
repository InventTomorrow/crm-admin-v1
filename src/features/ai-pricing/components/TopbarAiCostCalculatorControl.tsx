import { useState } from 'react';
import { LuCalculator } from 'react-icons/lu';
import { usePermissions } from '@/features/auth/auth.hooks';
import { SystemPermissions } from '@/lib/permissions';
import { useCurrentPricing } from '../ai-pricing.hooks';
import { AiCostCalculatorDialog } from './AiCostCalculatorDialog';

/** Topbar entry point for the AI cost calculator — reachable from every admin page. */
export function TopbarAiCostCalculatorControl() {
  const { can } = usePermissions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: pricing } = useCurrentPricing();

  if (!can(SystemPermissions.SETTINGS_VIEW)) return null;

  return (
    <>
      <button
        type="button"
        aria-label="AI cost calculator"
        title="AI cost calculator"
        onClick={() => setIsDialogOpen(true)}
        className="btn btn-icon size-8 rounded-full hover:bg-default-150"
      >
        <LuCalculator className="size-4.5" />
      </button>

      <AiCostCalculatorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        availableModels={pricing ?? []}
      />
    </>
  );
}
