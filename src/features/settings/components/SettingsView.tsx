import { useState } from 'react';
import { LuCreditCard } from 'react-icons/lu';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { SupportContactCard } from '@/features/platform-settings/SupportContactCard';
import { AppearanceCard } from './AppearanceCard';
import { ProfileCard } from './ProfileCard';
import { SecurityCard } from './SecurityCard';
import { SettingsCard } from './SettingsCard';

type SettingsTab = 'general' | 'profile' | 'security' | 'appearance' | 'billing';

const SETTINGS_TABS: { key: SettingsTab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'profile', label: 'Profile' },
  { key: 'security', label: 'Security' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'billing', label: 'Billing' },
];

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Portal configuration and preferences" />

      <div className="mb-5">
        <Tabs
          tabs={SETTINGS_TABS}
          active={activeTab}
          onChange={tabKey => setActiveTab(tabKey as SettingsTab)}
        />
      </div>

      <div className="space-y-5">
        {activeTab === 'general' && <SupportContactCard />}

        {activeTab === 'profile' && <ProfileCard />}

        {activeTab === 'security' && <SecurityCard />}

        {activeTab === 'appearance' && <AppearanceCard />}

        {activeTab === 'billing' && (
          <SettingsCard
            icon={LuCreditCard}
            title="Payment gateway"
            description="No live gateway is connected yet. Checkout uses a stub provider behind a swappable interface — wiring a real provider won't require UI changes."
          >
            <Badge tone="warning">Provider: noop (stub)</Badge>
          </SettingsCard>
        )}
      </div>
    </div>
  );
}
