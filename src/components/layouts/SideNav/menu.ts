import type { IconType } from 'react-icons/lib';
import { SystemPermissions, type PermissionRequirement } from '@/lib/permissions';
import {
  LuBellRing,
  LuBuilding2,
  LuCalculator,
  LuClipboardList,
  LuCreditCard,
  LuHandshake,
  LuInbox,
  LuLayoutDashboard,
  LuLink,
  LuMail,
  LuMessageSquare,
  LuNewspaper,
  LuSettings,
  LuUsers,
} from 'react-icons/lu';

export type MenuItemType = {
  key: string;
  label: string;
  isTitle?: boolean;
  href?: string;
  children?: MenuItemType[];

  icon?: IconType;
  parentKey?: string;
  target?: string;
  isDisabled?: boolean;
  /**
   * Permission needed to see this link. Matches the route's own guard in
   * Routes.tsx — hiding the link is cosmetic, RouteGuard does the blocking.
   * Section titles inherit visibility from the items beneath them.
   */
  permission?: PermissionRequirement;
};

export const menuItemsData: MenuItemType[] = [
  {
    key: 'menu',
    label: 'Menu',
    isTitle: true,
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: LuLayoutDashboard,
    permission: SystemPermissions.DASHBOARD_VIEW,
  },
  {
    key: 'users',
    label: 'Users',
    href: '/users',
    icon: LuUsers,
    // Billing roles reach payments and invoices through the Users page.
    permission: [SystemPermissions.USERS_VIEW, SystemPermissions.SUBSCRIPTIONS_VIEW],
  },
  {
    key: 'tenants',
    label: 'Workspaces',
    href: '/tenants',
    icon: LuBuilding2,
    permission: SystemPermissions.TENANTS_VIEW,
  },
  {
    key: 'billing',
    label: 'Billing',
    isTitle: true,
  },
  {
    key: 'plans',
    label: 'Pricing plans',
    href: '/plans',
    icon: LuCreditCard,
    permission: SystemPermissions.PLANS_VIEW,
  },
  {
    key: 'lead-pricing',
    label: 'Lead pricing',
    href: '/lead-pricing',
    icon: LuCalculator,
    permission: SystemPermissions.PLANS_VIEW,
  },
  {
    key: 'custom-plan-requests',
    label: 'Custom plan requests',
    href: '/custom-plan-requests',
    icon: LuClipboardList,
    permission: SystemPermissions.SUBSCRIPTION_REQUESTS_VIEW,
  },
  {
    key: 'requests',
    label: 'User payments',
    href: '/subscription-requests',
    icon: LuInbox,
    permission: SystemPermissions.SUBSCRIPTION_REQUESTS_VIEW,
  },
  {
    key: 'checkout-links',
    label: 'Checkout links',
    href: '/checkout-links',
    icon: LuLink,
    permission: SystemPermissions.CHECKOUT_LINKS_VIEW,
  },
  {
    key: 'affiliates',
    label: 'Affiliates',
    href: '/affiliates',
    icon: LuHandshake,
    permission: SystemPermissions.AFFILIATES_VIEW,
  },
  {
    key: 'content',
    label: 'Content',
    isTitle: true,
  },
  {
    key: 'blog',
    label: 'Blog',
    icon: LuNewspaper,
    children: [
      {
        key: 'blog-posts',
        label: 'Posts',
        href: '/blog',
        permission: SystemPermissions.BLOG_VIEW,
      },
      {
        key: 'blog-categories',
        label: 'Categories',
        href: '/blog/categories',
        permission: SystemPermissions.BLOG_CATEGORIES_VIEW,
      },
      {
        key: 'blog-authors',
        label: 'Authors',
        href: '/blog/authors',
        permission: SystemPermissions.BLOG_AUTHORS_VIEW,
      },
    ],
  },
  {
    key: 'newsletter',
    label: 'Newsletter',
    href: '/newsletter',
    icon: LuMail,
    permission: SystemPermissions.NEWSLETTER_VIEW,
  },
  {
    key: 'contact-messages',
    label: 'Contact messages',
    href: '/contact-messages',
    icon: LuMessageSquare,
    permission: SystemPermissions.CONTACT_MESSAGES_VIEW,
  },
  {
    key: 'system',
    label: 'System',
    isTitle: true,
  },
  {
    key: 'notifications',
    label: 'Notifications',
    href: '/notifications',
    icon: LuBellRing,
    permission: SystemPermissions.NOTIFICATIONS_VIEW,
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: LuSettings,
    children: [
      {
        key: 'settings-general',
        label: 'General',
        href: '/settings/general',
        permission: SystemPermissions.SETTINGS_VIEW,
      },
      {
        key: 'settings-ai-pricing',
        label: 'AI Pricing',
        href: '/settings/ai-pricing',
        permission: SystemPermissions.SETTINGS_VIEW,
      },
      // No permission — the admin's own account.
      { key: 'settings-profile', label: 'Profile', href: '/settings/profile' },
      { key: 'settings-security', label: 'Security', href: '/settings/security' },
      { key: 'settings-appearance', label: 'Appearance', href: '/settings/appearance' },
      {
        key: 'settings-billing',
        label: 'Billing',
        href: '/settings/billing',
        permission: SystemPermissions.SETTINGS_VIEW,
      },
    ],
  },
];
