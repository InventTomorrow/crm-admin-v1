import PageMeta from '@/components/PageMeta';
import { PlanFormView } from '@/features/plans/components/PlanFormView';

const PlanCreatePage = () => {
  return (
    <>
      <PageMeta title="New plan" />
      <main>
        <PlanFormView />
      </main>
    </>
  );
};

export default PlanCreatePage;
