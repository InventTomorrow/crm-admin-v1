import type { IconType } from 'react-icons/lib';
import { SystemPermissions, type SystemPermission } from '@/lib/permissions';
import {
  LuBellRing,
  LuBuilding2,
  LuCreditCard,
  LuInbox,
  LuLayoutDashboard,
  LuLink,
  LuMail,
  LuMessageSquare,
  LuNewspaper,
  LuReceiptText,
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
  permission?: SystemPermission;
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
    permission: SystemPermissions.USERS_VIEW,
  },
  {
    key: 'tenants',
    label: 'Tenants',
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
    label: 'Plans',
    href: '/plans',
    icon: LuCreditCard,
    permission: SystemPermissions.PLANS_VIEW,
  },
  {
    key: 'subscriptions',
    label: 'Subscriptions',
    href: '/subscriptions',
    icon: LuReceiptText,
    permission: SystemPermissions.SUBSCRIPTIONS_VIEW,
  },
  {
    key: 'requests',
    label: 'Requests',
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
  // No permission — Settings is the admin's own profile.
  { key: 'settings', label: 'Settings', href: '/settings', icon: LuSettings },
];
