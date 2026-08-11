import PageMeta from '@/components/PageMeta';
import { DashboardView } from '@/features/dashboard/components/DashboardView';

const DashboardPage = () => {
  return (
    <>
      <PageMeta title="Dashboard" />
      <main>
        <DashboardView />
      </main>
    </>
  );
};

export default DashboardPage;
