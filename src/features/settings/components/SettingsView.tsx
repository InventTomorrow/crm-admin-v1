import { useMemo, useState } from 'react';
import { LuCreditCard } from 'react-icons/lu';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { usePermissions } from '@/features/auth/auth.hooks';
import { SupportContactCard } from '@/features/platform-settings/SupportContactCard';
import { SystemPermissions, type SystemPermission } from '@/lib/permissions';
import { AppearanceCard } from './AppearanceCard';
import { ProfileCard } from './ProfileCard';
import { SecurityCard } from './SecurityCard';
import { SettingsCard } from './SettingsCard';

type SettingsTab = 'general' | 'profile' | 'security' | 'appearance' | 'billing';

// Profile, Security and Appearance are the admin's own account — always shown.
// The platform-wide tabs carry the permission that reveals them.
const SETTINGS_TABS: { key: SettingsTab; label: string; permission?: SystemPermission }[] = [
  { key: 'general', label: 'General', permission: SystemPermissions.SETTINGS_VIEW },
  { key: 'profile', label: 'Profile' },
  { key: 'security', label: 'Security' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'billing', label: 'Billing', permission: SystemPermissions.SETTINGS_VIEW },
];

export function SettingsView() {
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const visibleTabs = useMemo(
    () => SETTINGS_TABS.filter(tab => !tab.permission || can(tab.permission)),
    [can]
  );

  // Falls back to the first tab the role can see, so a hidden default never
  // renders an empty panel.
  const openTab = visibleTabs.some(tab => tab.key === activeTab)
    ? activeTab
    : (visibleTabs[0]?.key ?? 'profile');

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Portal configuration and preferences" />

      <div className="mb-5">
        <Tabs
          tabs={visibleTabs}
          active={openTab}
          onChange={tabKey => setActiveTab(tabKey as SettingsTab)}
        />
      </div>

      <div className="space-y-5">
        {openTab === 'general' && can(SystemPermissions.SETTINGS_VIEW) && <SupportContactCard />}

        {openTab === 'profile' && <ProfileCard />}

        {openTab === 'security' && <SecurityCard />}

        {openTab === 'appearance' && <AppearanceCard />}

        {openTab === 'billing' && can(SystemPermissions.SETTINGS_VIEW) && (
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
