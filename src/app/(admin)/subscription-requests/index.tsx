import PageMeta from '@/components/PageMeta';
import { RequestsView } from '@/features/subscription-requests/components/RequestsView';

const SubscriptionRequestsPage = () => {
  return (
    <>
      <PageMeta title="Subscription requests" />
      <main>
        <RequestsView />
      </main>
    </>
  );
};

export default SubscriptionRequestsPage;
