import PageMeta from '@/components/PageMeta';
import { CustomPlanRequestsView } from '@/features/custom-plan-requests/components/CustomPlanRequestsView';

const CustomPlanRequestsPage = () => {
  return (
    <>
      <PageMeta title="Custom plan requests" />
      <main>
        <CustomPlanRequestsView />
      </main>
    </>
  );
};

export default CustomPlanRequestsPage;
