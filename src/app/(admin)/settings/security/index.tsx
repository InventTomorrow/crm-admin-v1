import PageMeta from '@/components/PageMeta';
import { SecuritySettingsView } from '@/features/settings/components/SecuritySettingsView';

const SecuritySettingsPage = () => {
  return (
    <>
      <PageMeta title="Security settings" />
      <main>
        <SecuritySettingsView />
      </main>
    </>
  );
};

export default SecuritySettingsPage;
