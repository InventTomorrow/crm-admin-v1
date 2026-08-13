// Shared API/domain types mirrored from the server admin module.

/** Standard paginated list shape returned by every admin list endpoint. */
export interface Paged<T> {
  items: T[];
  meta: { page: number; limit: number; total: number };
}

export type SystemRole = 'SYSTEM_ADMIN' | 'SYSTEM_MANAGER';
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'CHURNED';
// TRIAL is paired with the plan's isTrial flag — the two always agree.
export type PlanTier = 'TRIAL' | 'STARTER' | 'GROWTH' | 'AGENCY' | 'RESELLER';
// PENDING is an unpaid gateway checkout handoff — it grants no access.
export type SubscriptionStatus = 'PENDING' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  systemRole: SystemRole;
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  onboardingStatus: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  /** Set when the user deleted their own account — restorable until purge. */
  deletedAt: string | null;
  /** Set once the grace period elapsed — nobody can restore the account after this. */
  permanentlyDeletedAt: string | null;
  /** Set once an admin erased the workspaces of a permanently deleted account. */
  workspaceDataWipedAt: string | null;
  systemMembership: { role: SystemRole } | null;
  _count: { memberships: number; ownedTenants: number };
}

export interface UserDetail extends Omit<UserListItem, '_count' | 'systemMembership'> {
  systemMembership: { role: SystemRole; createdAt: string } | null;
  /** Deadline for restoring a deleted account. */
  scheduledPurgeAt: string | null;
  /** Workspaces closed by the deletion, restored alongside the account. */
  deletionTenantIds: string[];
  memberships: {
    id: string;
    tenant: { id: string; name: string; status: TenantStatus };
    role: { name: string };
    joinedAt: string;
  }[];
  ownedTenants: { id: string; name: string; status: TenantStatus }[];
}

export interface TenantListItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: TenantStatus;
  businessVertical: BusinessVertical;
  createdAt: string;
  owner: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
  activePlan: { id: string; name: string; tier: PlanTier } | null;
  _count: { memberships: number; leads: number };
}

/** One connect event from the append-only WhatsApp connection history. */
export interface WhatsAppConnectionItem {
  id: string;
  tenantId: string;
  phoneNumber: string;
  displayName: string | null;
  devicePlatform: string | null;
  connectedByUserId: string | null;
  connectedIp: string | null;
  userAgent: string | null;
  connectedAt: string;
  disconnectedAt: string | null;
  disconnectReason: string | null;
  isActive: boolean;
  /** Only present on the user-scoped endpoint (aggregated across memberships). */
  tenant?: { id: string; name: string };
}

export interface WorkspaceRole {
  id: string;
  name: string;
  permissions: string[];
  tenantId: string;
}

export interface TenantDetail extends Omit<TenantListItem, '_count'> {
  roles: WorkspaceRole[];
  memberships: {
    id: string;
    user: { id: string; email: string; firstName: string | null; lastName: string | null };
    role: { id: string; name: string };
    joinedAt: string;
  }[];
  subscriptions: Subscription[];
  _count: { leads: number; products: number; channels: number };
}

export type BusinessVertical = 'ECOMMERCE' | 'RESTAURANT' | 'MARKETING_AGENCY';

export type PlanDuration =
  | 'DAYS_3'
  | 'DAYS_7'
  | 'DAYS_14'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMI_ANNUAL'
  | 'ANNUAL'
  | 'CUSTOM_DAYS';

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  isSystem: boolean;

  // Null = universal plan (carries all three catalogue counts, offered to
  // every vertical). Non-null = scoped to that vertical only.
  businessVertical: BusinessVertical | null;

  maxWorkspaces: number;
  maxMembersPerWorkspace: number;
  maxChannels: number;

  maxProducts: number | null;
  maxMenuItems: number | null;
  maxServices: number | null;

  maxMonthlyMessages: number;
  maxImageMessages: number;
  maxVoiceMessages: number;

  duration: PlanDuration;
  customDurationDays: number | null;
  isTrial: boolean;
  price: number;
  wholesalePrice: number;
  currency: string;

  // Landing-page marketing fields — `price` is the charged (discounted)
  // price, originalPrice the struck-through "actual" one.
  originalPrice: number | null;
  offerEndsAt: string | null;
  tagline: string | null;
  ctaLabel: string | null;
  isFeatured: boolean;
  isComingSoon: boolean;
  features: string[];

  canResell: boolean;
  canWhitelabel: boolean;
  providerPlanId: string | null;
  isPublic: boolean;
  isActive: boolean;
  // `_count.subscriptions` is active/trialing only — the subscribers the
  // migrate dialog can move. `totalSubscriberCount` includes cancelled and
  // expired ones, which still reference the plan and block deletion.
  _count?: { subscriptions: number; activeTenants: number };
  totalSubscriberCount?: number;
}

export interface Subscription {
  id: string;
  // Subscriptions belong to the CRM account owner; one covers every workspace
  // that owner runs (up to plan.maxWorkspaces).
  ownerUserId: string;
  planId: string;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  createdAt: string;
  owner?: { id: string; email: string; firstName: string | null; lastName: string | null };
  plan?: { id: string; name: string; tier: PlanTier; price: number; currency: string };
}

export interface Metrics {
  totalUsers: number;
  systemUsers: number;
  tenantsByStatus: { status: TenantStatus; _count: { _all: number } }[];
  activeSubscriptions: number;
  mrr: number;
  plans: number;
  range: { from: string; to: string };
  newTenants: number;
  newUsers: number;
  newSubscriptions: number;
  series: { date: string; tenants: number; users: number }[];
}
