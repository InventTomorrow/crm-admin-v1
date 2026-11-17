import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import { AffiliateDetailView } from '@/features/affiliates/components/AffiliateDetailView';

const AffiliateDetailPage = () => {
  return (
    <>
      <PageMeta title="Affiliate" />
      <main>
        <PageBreadcrumb title="Affiliate" subtitle="Affiliates" />
        <AffiliateDetailView />
      </main>
    </>
  );
};

export default AffiliateDetailPage;
