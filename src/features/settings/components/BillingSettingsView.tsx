import { PageHeader } from '@/components/PageHeader';
import { ReferralStackingCard } from '@/features/affiliates/components/ReferralStackingCard';
import { PaymentGatewayCard } from './PaymentGatewayCard';

export function BillingSettingsView() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Billing" description="Payment gateway and discount rules" />
      <div className="space-y-5">
        <PaymentGatewayCard />
        <ReferralStackingCard />
      </div>
    </div>
  );
}
