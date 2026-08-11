import PageMeta from '@/components/PageMeta';
import { NotificationsView } from '@/features/notifications/components/NotificationsView';

const NotificationsPage = () => {
  return (
    <>
      <PageMeta title="Notifications" />
      <main>
        <NotificationsView />
      </main>
    </>
  );
};

export default NotificationsPage;
