import { PageHeader } from '@/components/PageHeader';
import { SecurityCard } from './SecurityCard';

export function SecuritySettingsView() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Security" description="Password and account security" />
      <SecurityCard />
    </div>
  );
}
