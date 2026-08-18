import type { IconType } from 'react-icons/lib';
import {
  LuBellRing,
  LuBuilding2,
  LuCreditCard,
  LuInbox,
  LuLayoutDashboard,
  LuLink,
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
};

export const menuItemsData: MenuItemType[] = [
  {
    key: 'menu',
    label: 'Menu',
    isTitle: true,
  },
  { key: 'dashboard', label: 'Dashboard', href: '/', icon: LuLayoutDashboard },
  { key: 'users', label: 'Users', href: '/users', icon: LuUsers },
  { key: 'tenants', label: 'Tenants', href: '/tenants', icon: LuBuilding2 },
  {
    key: 'billing',
    label: 'Billing',
    isTitle: true,
  },
  { key: 'plans', label: 'Plans', href: '/plans', icon: LuCreditCard },
  { key: 'subscriptions', label: 'Subscriptions', href: '/subscriptions', icon: LuReceiptText },
  { key: 'requests', label: 'Requests', href: '/subscription-requests', icon: LuInbox },
  { key: 'checkout-links', label: 'Checkout links', href: '/checkout-links', icon: LuLink },
  {
    key: 'content',
    label: 'Content',
    isTitle: true,
  },
  { key: 'blog', label: 'Blog', href: '/blog', icon: LuNewspaper },
  {
    key: 'system',
    label: 'System',
    isTitle: true,
  },
  { key: 'notifications', label: 'Notifications', href: '/notifications', icon: LuBellRing },
  { key: 'settings', label: 'Settings', href: '/settings', icon: LuSettings },
];
