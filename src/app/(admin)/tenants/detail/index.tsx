import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import { TenantDetailView } from '@/features/tenants/components/TenantDetailView';

const TenantDetailPage = () => {
  return (
    <>
      <PageMeta title="Workspace" />
      <main>
        <PageBreadcrumb title="Workspace" subtitle="Workspaces" />
        <TenantDetailView />
      </main>
    </>
  );
};

export default TenantDetailPage;
