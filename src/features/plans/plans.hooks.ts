import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import {
  createPlan,
  deletePlan,
  getPlan,
  listActiveSubscribers,
  listPlans,
  migrateSubscribers,
  updatePlan,
  type MigrateSubscribersInput,
  type PlanInput,
} from './plans.api';

export function usePlans() {
  return useQuery({ queryKey: ['plans'], queryFn: listPlans });
}

/** Fetches one plan directly — the edit page must not rely on the list cache. */
export function usePlan(id: string) {
  return useQuery({
    queryKey: ['plans', id],
    queryFn: () => getPlan(id),
    enabled: !!id,
  });
}

/** Single hook for both create and edit — pass an id to update. */
export function useSavePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: PlanInput }) =>
      id ? updatePlan(id, input) : createPlan(input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      toast.success(variables.id ? 'Plan updated' : 'Plan created');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plan deleted');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function usePlanActiveSubscribers(planId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['plans', planId, 'active-subscribers'],
    queryFn: () => listActiveSubscribers(planId),
    enabled,
  });
}

export function useMigrateSubscribers(sourcePlanId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MigrateSubscribersInput) => migrateSubscribers(sourcePlanId, input),
    onSuccess: result => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      qc.invalidateQueries({ queryKey: ['plans', sourcePlanId, 'active-subscribers'] });
      toast.success(
        `Moved ${result.migratedCount} subscriber${result.migratedCount === 1 ? '' : 's'} to the new plan`
      );
    },
    onError: error => toast.error(apiMessage(error)),
  });
}
