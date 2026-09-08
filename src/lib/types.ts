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

/**
 * Minimal account shape returned by `/admin/users/lookup` — what the billing
 * owner pickers need, and nothing a manager shouldn't see.
 */
export interface UserLookupItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

/** Plan a user is currently on, trial included. Null when they have none. */
export interface ActiveSubscription {
  id: string;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  plan: { id: string; name: string; tier: PlanTier; price: number; isTrial: boolean };
}

export interface UserListItem {
  id: string;
  email: string;
  /** Real address of a closed account whose `email` is now a tombstone. */
  originalEmail: string | null;
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
  activeSubscription: ActiveSubscription | null;
  /** Order revenue summed across every workspace this user owns. Their sales —
   *  not what they pay us, which is `activeSubscription`. */
  ownedRevenue: number;
  /** Lifetime AI cost summed across every workspace this user owns. */
  ownedAiUsageCostUsd: number;
  ownedAiUsageCostPkr: number | null;
  _count: { memberships: number; ownedTenants: number };
}

/** Columns the users list can be ordered by. Sorting happens server-side, so it
 *  spans every matching row rather than reordering the current page —
 *  `workspaces` and `revenue` included, which the service ranks itself. */
export type UserSortField =
  | 'name'
  | 'email'
  | 'phone'
  | 'createdAt'
  | 'lastLoginAt'
  | 'workspaces'
  | 'revenue';

export interface UserDetail extends Omit<UserListItem, 'systemMembership'> {
  systemMembership: { role: SystemRole; createdAt: string } | null;
  isTester: boolean;
  updatedAt: string;
  /** Deadline for restoring a deleted account. */
  scheduledPurgeAt: string | null;
  /** Workspaces closed by the deletion, restored alongside the account. */
  deletionTenantIds: string[];
  /** Every subscription this user has ever owned, newest first. */
  subscriptionHistory: {
    id: string;
    status: SubscriptionStatus;
    provider: string;
    trialEndsAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelledAt: string | null;
    createdAt: string;
    plan: { id: string; name: string; tier: PlanTier; price: number; isTrial: boolean };
  }[];
  memberships: {
    id: string;
    tenant: {
      id: string;
      name: string;
      status: TenantStatus;
      businessVertical: BusinessVertical;
      createdAt: string;
    };
    role: { name: string };
    joinedAt: string;
  }[];
  ownedTenants: {
    id: string;
    name: string;
    status: TenantStatus;
    businessVertical: BusinessVertical;
    createdAt: string;
    suspendedByUserDeletion: boolean;
    /** This workspace's own order revenue. */
    revenue: number;
    aiUsageCostUsd: number;
    aiUsageCostPkr: number | null;
    _count: { leads: number; memberships: number; products: number };
  }[];
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
  /** Booked order revenue for this workspace — excludes cancelled, refunded
   *  and draft orders, matching the figure its owner sees in the CRM. */
  revenue: number;
  /** Lifetime input+output tokens across every LLM call this workspace's AI made. */
  aiUsageTokens: number;
  aiUsageCostUsd: number;
  aiUsageCostPkr: number | null;
  _count: { memberships: number; leads: number };
}

/** One day's AI token usage — the tenant AI-usage chart's series point. */
export interface TenantAiUsagePoint {
  date: string; // UTC day, YYYY-MM-DD
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** Per-model token totals + cost, for one tenant within a range. `usdCost` is null
 *  only when no price has been entered yet for that model — a real $0 never shows null. */
export interface ModelCostBreakdown {
  provider: string;
  model: string;
  promptTokens: number;
  cachedTokens: number;
  completionTokens: number;
  totalTokens: number;
  usdCost: number | null;
  pkrCost: number | null;
}

export interface TenantAiUsage {
  totals: {
    calls: number;
    promptTokens: number;
    cachedTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  series: TenantAiUsagePoint[];
  costByModel: ModelCostBreakdown[];
  totalUsdCost: number;
  totalPkrCost: number | null;
  hasUnpricedUsage: boolean;
}

/** One $/1M-token rate for a (provider, model) — manually entered by an admin. */
export interface AiModelPricing {
  id: string;
  provider: string;
  model: string;
  inputPricePerMillionTokens: number;
  cachedInputPricePerMillionTokens: number | null;
  outputPricePerMillionTokens: number;
  currency: string;
  effectiveFrom: string;
  createdAt: string;
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

export type BusinessVertical = 'ECOMMERCE' | 'RESTAURANT' | 'MARKETING_AGENCY' | 'HEALTHCARE';

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

  // Null = universal plan (carries every catalogue count, offered to every
  // vertical). Non-null = scoped to that vertical only.
  businessVertical: BusinessVertical | null;

  maxWorkspaces: number;
  maxMembersPerWorkspace: number;
  maxChannels: number;

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

/** The gap between the plan's price and what was collected for it. */
export interface SubscriptionDiscount {
  /** Currency units below the plan price — always greater than zero. */
  amount: number;
  /** Rounded, for the badge: 2,000 off a 5,000 plan reads as 40. */
  percent: number;
  /** A promo campaign, or whatever the admin typed. Null when nobody recorded one. */
  reason: string | null;
}

/** What a subscription was quoted at versus what actually came in. */
export interface SubscriptionBilling {
  /** The plan's price when this subscription was bought, not today's price. */
  planPrice: number;
  /** Null when no payment was ever recorded against the subscription. */
  paidAmount: number | null;
  currency: string;
  paidAt: string | null;
  method: string | null;
  discount: SubscriptionDiscount | null;
}

export interface Subscription {
  id: string;
  // Subscriptions belong to the CRM account owner; one covers every workspace
  // that owner runs (up to plan.maxWorkspaces).
  ownerUserId: string;
  planId: string;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  createdAt: string;
  owner?: { id: string; email: string; firstName: string | null; lastName: string | null };
  plan?: { id: string; name: string; tier: PlanTier; price: number; currency: string };
}

/**
 * A subscription as the admin Subscriptions screen sees it. The tenant detail
 * endpoint returns the bare `Subscription` — only the subscriptions endpoints
 * price the row, so only they promise `billing`.
 */
export interface SubscriptionListItem extends Subscription {
  billing: SubscriptionBilling;
}

/** Columns the subscriptions list can be ordered by — all server-side. */
export type SubscriptionSortField =
  | 'createdAt'
  | 'status'
  | 'currentPeriodEnd'
  | 'account'
  | 'plan'
  | 'price'
  | 'paid';

/** Platform revenue — what subscribers pay us. Never workspace order revenue. */
export interface SubscriptionRevenue {
  /** All-time subscription payments received. */
  collected: number;
  /** How many payments make up `collected`. */
  payments: number;
  /** Recurring value of every live subscription, at current plan prices. */
  mrr: number;
  activeSubscriptions: number;
}

export interface Metrics {
  totalUsers: number;
  systemUsers: number;
  tenantsByStatus: { status: TenantStatus; _count: { _all: number } }[];
  activeSubscriptions: number;
  /** Recurring value of every live subscription — a snapshot, not range-scoped. */
  mrr: number;
  /** Subscription payments banked inside the selected range. Plan money only —
   *  workspace order sales are never mixed in. */
  subscriptionRevenue: number;
  /** How many payments make up `subscriptionRevenue`. */
  subscriptionPayments: number;
  /** All-time subscription payments, independent of the range. */
  lifetimeSubscriptionRevenue: number;
  plans: number;
  range: { from: string; to: string };
  newTenants: number;
  newUsers: number;
  newSubscriptions: number;
  series: { date: string; tenants: number; users: number }[];
  /** Latest signups overall — a snapshot, deliberately not range-scoped. */
  recentUsers: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    createdAt: string;
    emailVerifiedAt: string | null;
    activeSubscription: {
      status: SubscriptionStatus;
      plan: { name: string; tier: PlanTier; isTrial: boolean };
    } | null;
  }[];
}

export type BlogPostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface BlogAuthor {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  postCount: number;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  postCount: number;
}

/** Row shape of GET /admin/blog/posts — no body, the table never renders one. */
export interface BlogPostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  tags: string[];
  status: BlogPostStatus;
  isFeatured: boolean;
  readingMinutes: number;
  publishedAt: string | null;
  authorName: string;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; slug: string };
  author?: { id: string; name: string; slug: string; avatarUrl: string | null } | null;
}

export interface BlogPostDetail extends BlogPostListItem {
  bodyHtml: string;
  bodyJson: unknown | null;
  coverImageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  categoryId: string;
  author?: {
    id: string;
    name: string;
    slug: string;
    title: string | null;
    bio: string | null;
    avatarUrl: string | null;
  } | null;
}
