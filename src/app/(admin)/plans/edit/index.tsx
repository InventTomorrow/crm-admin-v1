import { Link, useParams } from 'react-router';
import PageMeta from '@/components/PageMeta';
import { ErrorState, LoadingState } from '@/components/states';
import { PlanFormView } from '@/features/plans/components/PlanFormView';
import { usePlan } from '@/features/plans/plans.hooks';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PlanEditPage = () => {
  const { planId = '' } = useParams<{ planId: string }>();
  const { data: plan, isLoading, isError, error, refetch } = usePlan(planId);

  return (
    <>
      <PageMeta title="Edit plan" />
      <main>
        {isLoading ? (
          <div className="card">
            <LoadingState />
          </div>
        ) : isError ? (
          <div className="card">
            <ErrorState error={error} onRetry={refetch} />
          </div>
        ) : !plan ? (
          <div className="card">
            <div className="card-body py-16 text-center">
              <p className="text-sm text-default-500">Plan not found.</p>
              <Link
                to="/plans"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'mt-4 border border-default-200'
                )}
              >
                Back to plans
              </Link>
            </div>
          </div>
        ) : (
          <PlanFormView existingPlan={plan} />
        )}
      </main>
    </>
  );
};

export default PlanEditPage;
