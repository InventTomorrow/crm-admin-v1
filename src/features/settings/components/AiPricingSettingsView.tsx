import { PageHeader } from '@/components/PageHeader';
import { AiPricingSettingsCard } from '@/features/ai-pricing/components/AiPricingSettingsCard';

export function AiPricingSettingsView() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="AI Pricing" description="Per model rates used to cost AI usage" />
      <AiPricingSettingsCard />
    </div>
  );
}
