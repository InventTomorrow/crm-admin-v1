import PageMeta from '@/components/PageMeta';
import { AffiliatesView } from '@/features/affiliates/components/AffiliatesView';

const AffiliatesPage = () => {
  return (
    <>
      <PageMeta title="Affiliates" />
      <main>
        <AffiliatesView />
      </main>
    </>
  );
};

export default AffiliatesPage;
