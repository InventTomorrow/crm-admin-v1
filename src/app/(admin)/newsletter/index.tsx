import PageMeta from '@/components/PageMeta';
import { SubscribersView } from '@/features/newsletter/components/SubscribersView';

const NewsletterPage = () => {
  return (
    <>
      <PageMeta title="Newsletter" />
      <main>
        <SubscribersView />
      </main>
    </>
  );
};

export default NewsletterPage;
