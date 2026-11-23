import PageMeta from '@/components/PageMeta';
import { LeadPricingView } from '@/features/lead-pricing/components/LeadPricingView';

const LeadPricingPage = () => {
  return (
    <>
      <PageMeta title="Lead pricing" />
      <main>
        <LeadPricingView />
      </main>
    </>
  );
};

export default LeadPricingPage;
