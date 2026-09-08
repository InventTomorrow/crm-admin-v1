import PageMeta from '@/components/PageMeta';
import { GeneralSettingsView } from '@/features/settings/components/GeneralSettingsView';

const GeneralSettingsPage = () => {
  return (
    <>
      <PageMeta title="General settings" />
      <main>
        <GeneralSettingsView />
      </main>
    </>
  );
};

export default GeneralSettingsPage;
