import PageMeta from '@/components/PageMeta';
import { SettingsView } from '@/features/settings/components/SettingsView';

const SettingsPage = () => {
  return (
    <>
      <PageMeta title="Settings" />
      <main>
        <SettingsView />
      </main>
    </>
  );
};

export default SettingsPage;
