import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import type { BusinessVertical, Plan, PlanDuration, PlanTier } from '@/lib/types';

/** Mirrors the server's planInputSchema (admin/plans/plans.dto.ts). */
export interface PlanInput {
  name: string;
  tier: PlanTier;
  businessVertical: BusinessVertical | null;

  maxWorkspaces: number;
  maxMembersPerWorkspace: number;
  maxChannels: number;

  // Required for the plan's own vertical; must be null for the other three.
  // A universal plan (businessVertical: null) carries all four.
  maxProducts: number | null;
  maxMenuItems: number | null;
  maxServices: number | null;
  maxClinicalServices: number | null;

  maxMonthlyMessages: number;
  maxImageMessages: number;
  maxVoiceMessages: number;

  duration: PlanDuration;
  customDurationDays: number | null;
  isTrial: boolean;
  price: number;
  wholesalePrice: number;
  currency: string;

  // Marketing fields shown on the landing page pricing section.
  originalPrice: number | null;
  offerEndsAt: string | null;
  tagline: string | null;
  ctaLabel: string | null;
  isFeatured: boolean;
  isComingSoon: boolean;
  features: string[];

  canResell: boolean;
  canWhitelabel: boolean;
  isPublic: boolean;
  isActive: boolean;
  isSystem: boolean;
}

export async function listPlans(): Promise<Plan[]> {
  const { data } = await apiClient.get<ApiEnvelope<Plan[]>>('/admin/plans');
  return data.data;
}

export async function getPlan(id: string): Promise<Plan> {
  const { data } = await apiClient.get<ApiEnvelope<Plan>>(`/admin/plans/${id}`);
  return data.data;
}

export async function createPlan(input: PlanInput): Promise<Plan> {
  const { data } = await apiClient.post<ApiEnvelope<Plan>>('/admin/plans', input);
  return data.data;
}

export async function updatePlan(id: string, input: Partial<PlanInput>): Promise<Plan> {
  const { data } = await apiClient.patch<ApiEnvelope<Plan>>(`/admin/plans/${id}`, input);
  return data.data;
}

export async function deletePlan(id: string) {
  await apiClient.delete(`/admin/plans/${id}`);
}

export interface PlanSubscriber {
  id: string;
  status: 'ACTIVE' | 'TRIALING';
  owner: { id: string; email: string; firstName: string | null; lastName: string | null };
}

export async function listActiveSubscribers(planId: string): Promise<PlanSubscriber[]> {
  const { data } = await apiClient.get<ApiEnvelope<PlanSubscriber[]>>(
    `/admin/plans/${planId}/active-subscribers`
  );
  return data.data;
}

export interface MigrateSubscribersInput {
  targetPlanId: string;
  /** Omitted = migrate every active/trialing subscriber on the source plan. */
  subscriptionIds?: string[];
}

export async function migrateSubscribers(sourcePlanId: string, input: MigrateSubscribersInput) {
  const { data } = await apiClient.post<ApiEnvelope<{ migratedCount: number }>>(
    `/admin/plans/${sourcePlanId}/migrate-subscribers`,
    input
  );
  return data.data;
}
