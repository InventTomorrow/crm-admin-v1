import type { SystemRole } from './types';

/**
 * Admin-portal permission catalogue. Mirrors
 * `server/src/common/constants/system-permissions.constant.ts` — every key here
 * guards the same route there, so the UI never offers an action the API will
 * reject. Add a permission on the server first, then mirror it here.
 *
 * This is a UX layer, not the security boundary: the server enforces every one
 * of these independently.
 */
export const SystemPermissions = {
  DASHBOARD_VIEW: 'dashboard:view',

  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_ROLE_CHANGE: 'users:role_change',
  USERS_DELETE: 'users:delete',
  USERS_RESTORE: 'users:restore',
  USERS_WIPE_WORKSPACES: 'users:wipe_workspaces',
  // Name/email search behind the billing owner pickers. Separate from
  // USERS_VIEW so picking an owner never implies account management.
  USERS_LOOKUP: 'users:lookup',

  TENANTS_VIEW: 'tenants:view',
  TENANTS_STATUS_CHANGE: 'tenants:status_change',

  PLANS_VIEW: 'plans:view',
  PLANS_CREATE: 'plans:create',
  PLANS_EDIT: 'plans:edit',
  PLANS_DELETE: 'plans:delete',
  PLANS_MIGRATE_SUBSCRIBERS: 'plans:migrate_subscribers',

  SUBSCRIPTIONS_VIEW: 'subscriptions:view',
  SUBSCRIPTIONS_CREATE: 'subscriptions:create',
  SUBSCRIPTIONS_EDIT: 'subscriptions:edit',
  SUBSCRIPTIONS_CANCEL: 'subscriptions:cancel',
  SUBSCRIPTIONS_DELETE: 'subscriptions:delete',

  SUBSCRIPTION_REQUESTS_VIEW: 'subscription_requests:view',
  SUBSCRIPTION_REQUESTS_APPROVE: 'subscription_requests:approve',
  SUBSCRIPTION_REQUESTS_REJECT: 'subscription_requests:reject',

  CHECKOUT_LINKS_VIEW: 'checkout_links:view',
  CHECKOUT_LINKS_CREATE: 'checkout_links:create',
  CHECKOUT_LINKS_REVOKE: 'checkout_links:revoke',

  BLOG_VIEW: 'blog:view',
  BLOG_CREATE: 'blog:create',
  BLOG_EDIT: 'blog:edit',
  BLOG_PUBLISH: 'blog:publish',
  BLOG_DELETE: 'blog:delete',
  BLOG_UPLOAD: 'blog:upload',

  BLOG_CATEGORIES_VIEW: 'blog_categories:view',
  BLOG_CATEGORIES_CREATE: 'blog_categories:create',
  BLOG_CATEGORIES_EDIT: 'blog_categories:edit',
  BLOG_CATEGORIES_DELETE: 'blog_categories:delete',

  NOTIFICATIONS_VIEW: 'notifications:view',

  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
} as const;

export type SystemPermission = (typeof SystemPermissions)[keyof typeof SystemPermissions];

export const ALL_SYSTEM_PERMISSIONS = Object.values(SystemPermissions) as SystemPermission[];

/**
 * Everything a manager is trusted with: billing, content and platform
 * settings. This is the full catalogue minus `users:*` and `tenants:*` —
 * account and workspace administration belongs to SYSTEM_ADMIN.
 */
const SYSTEM_MANAGER_PERMISSIONS: SystemPermission[] = [
  SystemPermissions.DASHBOARD_VIEW,
  SystemPermissions.USERS_LOOKUP,
  SystemPermissions.PLANS_VIEW,
  SystemPermissions.PLANS_CREATE,
  SystemPermissions.PLANS_EDIT,
  SystemPermissions.PLANS_DELETE,
  SystemPermissions.PLANS_MIGRATE_SUBSCRIBERS,
  SystemPermissions.SUBSCRIPTIONS_VIEW,
  SystemPermissions.SUBSCRIPTIONS_CREATE,
  SystemPermissions.SUBSCRIPTIONS_EDIT,
  SystemPermissions.SUBSCRIPTIONS_CANCEL,
  SystemPermissions.SUBSCRIPTIONS_DELETE,
  SystemPermissions.SUBSCRIPTION_REQUESTS_VIEW,
  SystemPermissions.SUBSCRIPTION_REQUESTS_APPROVE,
  SystemPermissions.SUBSCRIPTION_REQUESTS_REJECT,
  SystemPermissions.CHECKOUT_LINKS_VIEW,
  SystemPermissions.CHECKOUT_LINKS_CREATE,
  SystemPermissions.CHECKOUT_LINKS_REVOKE,
  SystemPermissions.BLOG_VIEW,
  SystemPermissions.BLOG_CREATE,
  SystemPermissions.BLOG_EDIT,
  SystemPermissions.BLOG_PUBLISH,
  SystemPermissions.BLOG_DELETE,
  SystemPermissions.BLOG_UPLOAD,
  SystemPermissions.BLOG_CATEGORIES_VIEW,
  SystemPermissions.BLOG_CATEGORIES_CREATE,
  SystemPermissions.BLOG_CATEGORIES_EDIT,
  SystemPermissions.BLOG_CATEGORIES_DELETE,
  SystemPermissions.NOTIFICATIONS_VIEW,
  SystemPermissions.SETTINGS_VIEW,
  SystemPermissions.SETTINGS_EDIT,
];

export const SYSTEM_ROLE_PERMISSIONS: Record<SystemRole, SystemPermission[]> = {
  SYSTEM_ADMIN: ALL_SYSTEM_PERMISSIONS,
  SYSTEM_MANAGER: SYSTEM_MANAGER_PERMISSIONS,
};

export const SYSTEM_ROLE_LABELS: Record<SystemRole, string> = {
  SYSTEM_ADMIN: 'System Admin',
  SYSTEM_MANAGER: 'System Manager',
};

/** Resolves a role to its permission set. Unknown roles get nothing. */
export function permissionsForRole(role: SystemRole | undefined): Set<SystemPermission> {
  return new Set(role ? SYSTEM_ROLE_PERMISSIONS[role] : []);
}
