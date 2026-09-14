import { LuLayers } from 'react-icons/lu';
import { LoadingState } from '@/components/states';
import { usePlans } from '@/features/plans/plans.hooks';
import { SubscriptionsByPlanChart } from './charts';

/** Active + trialing subscriber count per plan — a snapshot, not range-scoped. */
export function SubscriptionsByPlanWidget() {
  const { data: plans, isLoading } = usePlans();

  if (isLoading) return <LoadingState />;

  if (!plans || plans.length === 0) {
    return (
      <p className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-default-500">
        <LuLayers className="size-5 text-default-400" />
        No plans configured yet.
      </p>
    );
  }

  return <SubscriptionsByPlanChart plans={plans} />;
}
