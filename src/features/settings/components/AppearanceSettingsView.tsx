import { PageHeader } from '@/components/PageHeader';
import { AppearanceCard } from './AppearanceCard';

export function AppearanceSettingsView() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Appearance" description="Theme and display preferences" />
      <AppearanceCard />
    </div>
  );
}
