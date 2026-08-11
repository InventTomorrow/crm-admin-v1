import PageMeta from '@/components/PageMeta';
import { SubscriptionsView } from '@/features/subscriptions/components/SubscriptionsView';

const SubscriptionsPage = () => {
  return (
    <>
      <PageMeta title="Subscriptions" />
      <main>
        <SubscriptionsView />
      </main>
    </>
  );
};

export default SubscriptionsPage;
