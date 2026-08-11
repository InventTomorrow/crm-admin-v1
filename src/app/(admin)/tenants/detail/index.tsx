import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import { TenantDetailView } from '@/features/tenants/components/TenantDetailView';

const TenantDetailPage = () => {
  return (
    <>
      <PageMeta title="Tenant" />
      <main>
        <PageBreadcrumb title="Tenant" subtitle="Tenants" />
        <TenantDetailView />
      </main>
    </>
  );
};

export default TenantDetailPage;
