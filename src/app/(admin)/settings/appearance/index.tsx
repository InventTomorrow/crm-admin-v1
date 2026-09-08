import PageMeta from '@/components/PageMeta';
import { AppearanceSettingsView } from '@/features/settings/components/AppearanceSettingsView';

const AppearanceSettingsPage = () => {
  return (
    <>
      <PageMeta title="Appearance settings" />
      <main>
        <AppearanceSettingsView />
      </main>
    </>
  );
};

export default AppearanceSettingsPage;
