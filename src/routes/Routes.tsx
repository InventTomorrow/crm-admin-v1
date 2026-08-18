import { lazy, type ReactNode } from 'react';

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
}

export const appRoutes: AppRoute[] = [
  { path: '/', name: 'Dashboard', element: <Dashboard /> },
  { path: '/users', name: 'Users', element: <Users /> },
  { path: '/tenants', name: 'Tenants', element: <Tenants /> },
  { path: '/tenants/:id', name: 'TenantDetail', element: <TenantDetail /> },
  { path: '/plans', name: 'Plans', element: <Plans /> },
  { path: '/plans/new', name: 'PlanCreate', element: <PlanCreate /> },
  { path: '/plans/:planId/edit', name: 'PlanEdit', element: <PlanEdit /> },
  { path: '/subscriptions', name: 'Subscriptions', element: <Subscriptions /> },
  {
    path: '/subscription-requests',
    name: 'SubscriptionRequests',
    element: <SubscriptionRequests />,
  },
  { path: '/checkout-links', name: 'CheckoutLinks', element: <CheckoutLinks /> },
  { path: '/blog', name: 'Blog', element: <Blog /> },
  { path: '/blog/new', name: 'BlogPostCreate', element: <BlogPostCreate /> },
  { path: '/blog/categories', name: 'BlogCategories', element: <BlogCategories /> },
  { path: '/blog/:postId/edit', name: 'BlogPostEdit', element: <BlogPostEdit /> },
  { path: '/blog/:postId/preview', name: 'BlogPostPreview', element: <BlogPostPreview /> },
  { path: '/notifications', name: 'Notifications', element: <Notifications /> },
  { path: '/settings', name: 'Settings', element: <Settings /> },
];

export const publicRoutes: AppRoute[] = [
  { path: '/login', name: 'Login', element: <Login /> },
  { path: '/forgot-password', name: 'ForgotPassword', element: <ForgotPassword /> },
  { path: '/reset-password', name: 'ResetPassword', element: <ResetPassword /> },
];
