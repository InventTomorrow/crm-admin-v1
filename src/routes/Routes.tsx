import { lazy, type ReactNode } from 'react';
import { SystemPermissions, type SystemPermission } from '@/lib/permissions';

// Guarded app pages (rendered inside AdminLayout chrome)
const Dashboard = lazy(() => import('@/app/(admin)/dashboard'));
const Users = lazy(() => import('@/app/(admin)/users'));
const Tenants = lazy(() => import('@/app/(admin)/tenants'));
const TenantDetail = lazy(() => import('@/app/(admin)/tenants/detail'));
const Plans = lazy(() => import('@/app/(admin)/plans'));
const PlanCreate = lazy(() => import('@/app/(admin)/plans/new'));
const PlanEdit = lazy(() => import('@/app/(admin)/plans/edit'));
const Subscriptions = lazy(() => import('@/app/(admin)/subscriptions'));
const SubscriptionRequests = lazy(() => import('@/app/(admin)/subscription-requests'));
const CheckoutLinks = lazy(() => import('@/app/(admin)/checkout-links'));
const Blog = lazy(() => import('@/app/(admin)/blog'));
const BlogPostCreate = lazy(() => import('@/app/(admin)/blog/new'));
const BlogPostEdit = lazy(() => import('@/app/(admin)/blog/edit'));
const BlogPostPreview = lazy(() => import('@/app/(admin)/blog/preview'));
const BlogCategories = lazy(() => import('@/app/(admin)/blog/categories'));
const BlogAuthors = lazy(() => import('@/app/(admin)/blog/authors'));
const Newsletter = lazy(() => import('@/app/(admin)/newsletter'));
const ContactMessages = lazy(() => import('@/app/(admin)/contact-messages'));
const Notifications = lazy(() => import('@/app/(admin)/notifications'));
const Settings = lazy(() => import('@/app/(admin)/settings'));

// Public pages (no chrome)
const Login = lazy(() => import('@/app/(auth)/login'));
const ForgotPassword = lazy(() => import('@/app/(auth)/forgot-password'));
const ResetPassword = lazy(() => import('@/app/(auth)/reset-password'));
const Error404 = lazy(() => import('@/app/(errors)/404'));

export const notFoundRoute: AppRoute = { path: '*', name: 'NotFound', element: <Error404 /> };

export interface AppRoute {
  path: string;
  name: string;
  element: ReactNode;
  /**
   * Permission required to open the page. Enforced by RouteGuard and mirrored
   * by the sidebar, which hides links the role can't use. Omit for pages that
   * need authentication only.
   */
  permission?: SystemPermission;
}

export const appRoutes: AppRoute[] = [
  {
    path: '/',
    name: 'Dashboard',
    element: <Dashboard />,
    permission: SystemPermissions.DASHBOARD_VIEW,
  },
  { path: '/users', name: 'Users', element: <Users />, permission: SystemPermissions.USERS_VIEW },
  {
    path: '/tenants',
    name: 'Tenants',
    element: <Tenants />,
    permission: SystemPermissions.TENANTS_VIEW,
  },
  {
    path: '/tenants/:id',
    name: 'TenantDetail',
    element: <TenantDetail />,
    permission: SystemPermissions.TENANTS_VIEW,
  },
  { path: '/plans', name: 'Plans', element: <Plans />, permission: SystemPermissions.PLANS_VIEW },
  {
    path: '/plans/new',
    name: 'PlanCreate',
    element: <PlanCreate />,
    permission: SystemPermissions.PLANS_CREATE,
  },
  {
    path: '/plans/:planId/edit',
    name: 'PlanEdit',
    element: <PlanEdit />,
    permission: SystemPermissions.PLANS_EDIT,
  },
  {
    path: '/subscriptions',
    name: 'Subscriptions',
    element: <Subscriptions />,
    permission: SystemPermissions.SUBSCRIPTIONS_VIEW,
  },
  {
    path: '/subscription-requests',
    name: 'SubscriptionRequests',
    element: <SubscriptionRequests />,
    permission: SystemPermissions.SUBSCRIPTION_REQUESTS_VIEW,
  },
  {
    path: '/checkout-links',
    name: 'CheckoutLinks',
    element: <CheckoutLinks />,
    permission: SystemPermissions.CHECKOUT_LINKS_VIEW,
  },
  { path: '/blog', name: 'Blog', element: <Blog />, permission: SystemPermissions.BLOG_VIEW },
  {
    path: '/blog/new',
    name: 'BlogPostCreate',
    element: <BlogPostCreate />,
    permission: SystemPermissions.BLOG_CREATE,
  },
  {
    path: '/blog/categories',
    name: 'BlogCategories',
    element: <BlogCategories />,
    permission: SystemPermissions.BLOG_CATEGORIES_VIEW,
  },
  {
    path: '/blog/authors',
    name: 'BlogAuthors',
    element: <BlogAuthors />,
    permission: SystemPermissions.BLOG_AUTHORS_VIEW,
  },
  {
    path: '/blog/:postId/edit',
    name: 'BlogPostEdit',
    element: <BlogPostEdit />,
    permission: SystemPermissions.BLOG_EDIT,
  },
  {
    path: '/blog/:postId/preview',
    name: 'BlogPostPreview',
    element: <BlogPostPreview />,
    permission: SystemPermissions.BLOG_VIEW,
  },
  {
    path: '/newsletter',
    name: 'Newsletter',
    element: <Newsletter />,
    permission: SystemPermissions.NEWSLETTER_VIEW,
  },
  {
    path: '/contact-messages',
    name: 'ContactMessages',
    element: <ContactMessages />,
    permission: SystemPermissions.CONTACT_MESSAGES_VIEW,
  },
  {
    path: '/notifications',
    name: 'Notifications',
    element: <Notifications />,
    permission: SystemPermissions.NOTIFICATIONS_VIEW,
  },
  // Auth-only: Settings is the admin's own profile. The platform support-contact
  // card inside it gates itself on settings:edit.
  { path: '/settings', name: 'Settings', element: <Settings /> },
];

export const publicRoutes: AppRoute[] = [
  { path: '/login', name: 'Login', element: <Login /> },
  { path: '/forgot-password', name: 'ForgotPassword', element: <ForgotPassword /> },
  { path: '/reset-password', name: 'ResetPassword', element: <ResetPassword /> },
];
