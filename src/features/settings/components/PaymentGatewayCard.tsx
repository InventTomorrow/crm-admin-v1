import { LuCreditCard } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { SettingsCard } from './SettingsCard';

export function PaymentGatewayCard() {
  return (
    <SettingsCard
      icon={LuCreditCard}
      title="Payment gateway"
      description="No live gateway is connected yet. Checkout uses a stub provider behind a swappable interface — wiring a real provider won't require UI changes."
    >
      <Badge tone="warning">Provider: noop (stub)</Badge>
    </SettingsCard>
  );
}
