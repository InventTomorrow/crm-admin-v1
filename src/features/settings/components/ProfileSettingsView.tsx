import { PageHeader } from '@/components/PageHeader';
import { ProfileCard } from './ProfileCard';

export function ProfileSettingsView() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Profile" description="Your name, email and avatar" />
      <ProfileCard />
    </div>
  );
}
