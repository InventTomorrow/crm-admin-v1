import PageMeta from '@/components/PageMeta';
import { BillingSettingsView } from '@/features/settings/components/BillingSettingsView';

const BillingSettingsPage = () => {
  return (
    <>
      <PageMeta title="Billing settings" />
      <main>
        <BillingSettingsView />
      </main>
    </>
  );
};

export default BillingSettingsPage;
