import { PageHeader } from '@/components/PageHeader';
import { SupportContactCard } from '@/features/platform-settings/SupportContactCard';

export function GeneralSettingsView() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="General" description="Customer support contact shown on public pages" />
      <SupportContactCard />
    </div>
  );
}
