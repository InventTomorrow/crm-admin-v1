import PageMeta from '@/components/PageMeta';
import { ProfileSettingsView } from '@/features/settings/components/ProfileSettingsView';

const ProfileSettingsPage = () => {
  return (
    <>
      <PageMeta title="Profile settings" />
      <main>
        <ProfileSettingsView />
      </main>
    </>
  );
};

export default ProfileSettingsPage;
