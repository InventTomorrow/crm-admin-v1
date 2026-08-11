import PageMeta from '@/components/PageMeta';
import { PlansView } from '@/features/plans/components/PlansView';

const PlansPage = () => {
  return (
    <>
      <PageMeta title="Plans" />
      <main>
        <PlansView />
      </main>
    </>
  );
};

export default PlansPage;
