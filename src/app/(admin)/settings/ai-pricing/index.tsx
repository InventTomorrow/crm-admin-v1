import PageMeta from '@/components/PageMeta';
import { AiPricingSettingsView } from '@/features/settings/components/AiPricingSettingsView';

const AiPricingSettingsPage = () => {
  return (
    <>
      <PageMeta title="AI pricing" />
      <main>
        <AiPricingSettingsView />
      </main>
    </>
  );
};

export default AiPricingSettingsPage;
