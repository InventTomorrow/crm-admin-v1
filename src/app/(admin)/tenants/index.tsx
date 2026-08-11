import PageMeta from '@/components/PageMeta';
import { TenantsView } from '@/features/tenants/components/TenantsView';

const TenantsPage = () => {
  return (
    <>
      <PageMeta title="Tenants" />
      <main>
        <TenantsView />
      </main>
    </>
  );
};

export default TenantsPage;
