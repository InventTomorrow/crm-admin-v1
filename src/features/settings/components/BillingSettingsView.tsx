import { PageHeader } from '@/components/PageHeader';
import { PaymentGatewayCard } from './PaymentGatewayCard';

export function BillingSettingsView() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Billing" description="Payment gateway configuration" />
      <PaymentGatewayCard />
    </div>
  );
}
