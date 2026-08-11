import { lazy, type ComponentType, type ReactNode } from 'react';

/**
 * Tailwick demo pages relocated to src/mock — kept browsable under /mock/* in
 * dev as visual reference while building real pages. The whole tree is inside
 * `import.meta.env.DEV` conditionals, so production builds drop every chunk.
 */

interface MockRoute {
  path: string;
  name: string;
  element: ReactNode;
}

const lazyMock = (loader: () => Promise<{ default: ComponentType }>) => {
  const MockPage = lazy(loader);
  return <MockPage />;
};

export const mockLayoutsRoutes: MockRoute[] = import.meta.env.DEV
  ? [
      {
        path: '/mock',
        name: 'MockEcommerce',
        element: lazyMock(() => import('@/mock/app/(admin)/(dashboards)/index')),
      },
      {
        path: '/mock/cart',
        name: 'MockCart',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(ecommerce)/cart')),
      },
      {
        path: '/mock/checkout',
        name: 'MockCheckout',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(ecommerce)/checkout')),
      },
      {
        path: '/mock/order-overview',
        name: 'MockOrderOverview',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(ecommerce)/order-overview')),
      },
      {
        path: '/mock/orders',
        name: 'MockOrders',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(ecommerce)/orders')),
      },
      {
        path: '/mock/product-create',
        name: 'MockProductCreate',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(ecommerce)/product-create')),
      },
      {
        path: '/mock/product-grid',
        name: 'MockProductGrid',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(ecommerce)/product-grid')),
      },
      {
        path: '/mock/product-list',
        name: 'MockProductList',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(ecommerce)/product-list')),
      },
      {
        path: '/mock/product-overview',
        name: 'MockProductOverview',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(ecommerce)/product-overview')),
      },
      {
        path: '/mock/sellers',
        name: 'MockSellers',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(ecommerce)/sellers')),
      },
      {
        path: '/mock/attendance',
        name: 'MockAttendances',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(hr)/attendance')),
      },
      {
        path: '/mock/attendance-main',
        name: 'MockAttendanceMain',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(hr)/attendance-main')),
      },
      {
        path: '/mock/create-leave',
        name: 'MockCreateLeave',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(hr)/create-leave')),
      },
      {
        path: '/mock/create-leave-employee',
        name: 'MockCreateLeaveEmployee',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(hr)/create-leave-employee')),
      },
      {
        path: '/mock/create-payslip',
        name: 'MockCreatePayslip',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(hr)/create-payslip')),
      },
      {
        path: '/mock/department',
        name: 'MockDepartment',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(hr)/department')),
      },
      {
        path: '/mock/employee',
        name: 'MockEmployee',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(hr)/employee')),
      },
      {
        path: '/mock/holidays',
        name: 'MockHolidays',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(hr)/holidays')),
      },
      {
        path: '/mock/leave',
        name: 'MockLeave',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(hr)/leave')),
      },
      {
        path: '/mock/leave-employee',
        name: 'MockLeaveEmployee',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(hr)/leave-employee')),
      },
      {
        path: '/mock/payroll-employee-salary',
        name: 'MockPayrollEmployeeSalary',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(hr)/payroll-employee-salary')),
      },
      {
        path: '/mock/payroll-payslip',
        name: 'MockPayrollPayslip',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(hr)/payroll-payslip')),
      },
      {
        path: '/mock/sales-estimates',
        name: 'MockSalesEstimates',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(hr)/sales-estimates')),
      },
      {
        path: '/mock/sales-expenses',
        name: 'MockSalesExpenses',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(hr)/sales-expenses')),
      },
      {
        path: '/mock/sales-payments',
        name: 'MockSalesPayments',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(hr)/sales-payments')),
      },
      {
        path: '/mock/add-new',
        name: 'MockInvoiceAddNew',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(invoice)/add-new')),
      },
      {
        path: '/mock/list',
        name: 'MockInvoiceList',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(invoice)/list')),
      },
      {
        path: '/mock/overview',
        name: 'MockInvoiceOverview',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(invoice)/overview')),
      },
      {
        path: '/mock/users-grid',
        name: 'MockUserGrid',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(users)/users-grid')),
      },
      {
        path: '/mock/users-list',
        name: 'MockUserList',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/(users)/users-list')),
      },
      {
        path: '/mock/calendar',
        name: 'MockCalendar',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/calendar')),
      },
      {
        path: '/mock/chat',
        name: 'MockChat',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/chat')),
      },
      {
        path: '/mock/mailbox',
        name: 'MockMailbox',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/mailbox')),
      },
      {
        path: '/mock/notes',
        name: 'MockNotes',
        element: lazyMock(() => import('@/mock/app/(admin)/(app)/notes')),
      },
      {
        path: '/mock/analytics',
        name: 'MockAnalytics',
        element: lazyMock(() => import('@/mock/app/(admin)/(dashboards)/analytics')),
      },
      {
        path: '/mock/email',
        name: 'MockEmail',
        element: lazyMock(() => import('@/mock/app/(admin)/(dashboards)/email')),
      },
      {
        path: '/mock/hr',
        name: 'MockHr',
        element: lazyMock(() => import('@/mock/app/(admin)/(dashboards)/hr')),
      },
      {
        path: '/mock/faqs',
        name: 'MockFaqs',
        element: lazyMock(() => import('@/mock/app/(admin)/(pages)/faqs')),
      },
      {
        path: '/mock/pricing',
        name: 'MockPricing',
        element: lazyMock(() => import('@/mock/app/(admin)/(pages)/pricing')),
      },
      {
        path: '/mock/starter',
        name: 'MockStarter',
        element: lazyMock(() => import('@/mock/app/(admin)/(pages)/starter')),
      },
      {
        path: '/mock/timeline',
        name: 'MockTimeline',
        element: lazyMock(() => import('@/mock/app/(admin)/(pages)/timeline')),
      },
    ]
  : [];

export const mockSingleRoutes: MockRoute[] = import.meta.env.DEV
  ? [
      {
        path: '/mock/basic-login',
        name: 'MockBasicLogin',
        element: lazyMock(() => import('@/mock/app/(auth)/basic-login')),
      },
      {
        path: '/mock/basic-register',
        name: 'MockBasicRegister',
        element: lazyMock(() => import('@/mock/app/(auth)/basic-register')),
      },
      {
        path: '/mock/basic-create-password',
        name: 'MockBasicCreatePassword',
        element: lazyMock(() => import('@/mock/app/(auth)/basic-create-password')),
      },
      {
        path: '/mock/basic-reset-password',
        name: 'MockBasicResetPassword',
        element: lazyMock(() => import('@/mock/app/(auth)/basic-reset-password')),
      },
      {
        path: '/mock/basic-verify-email',
        name: 'MockBasicVerifyEmail',
        element: lazyMock(() => import('@/mock/app/(auth)/basic-verify-email')),
      },
      {
        path: '/mock/basic-logout',
        name: 'MockBasicLogout',
        element: lazyMock(() => import('@/mock/app/(auth)/basic-logout')),
      },
      {
        path: '/mock/basic-two-steps',
        name: 'MockBasicTwoStep',
        element: lazyMock(() => import('@/mock/app/(auth)/basic-two-steps')),
      },
      {
        path: '/mock/cover-login',
        name: 'MockCoverLogin',
        element: lazyMock(() => import('@/mock/app/(auth)/cover-login')),
      },
      {
        path: '/mock/modern-login',
        name: 'MockModernLogin',
        element: lazyMock(() => import('@/mock/app/(auth)/modern-login')),
      },
      {
        path: '/mock/boxed-login',
        name: 'MockBoxedLogin',
        element: lazyMock(() => import('@/mock/app/(auth)/boxed-login')),
      },
      {
        path: '/mock/onepage-landing',
        name: 'MockOnePageLanding',
        element: lazyMock(() => import('@/mock/app/(landing)/onepage-landing')),
      },
      {
        path: '/mock/product-landing',
        name: 'MockProductLanding',
        element: lazyMock(() => import('@/mock/app/(landing)/product-landing')),
      },
      {
        path: '/mock/404',
        name: 'Mock404',
        element: lazyMock(() => import('@/mock/app/(others)/404')),
      },
      {
        path: '/mock/coming-soon',
        name: 'MockComingSoon',
        element: lazyMock(() => import('@/mock/app/(others)/coming-soon')),
      },
      {
        path: '/mock/maintenance',
        name: 'MockMaintenance',
        element: lazyMock(() => import('@/mock/app/(others)/maintenance')),
      },
      {
        path: '/mock/offline',
        name: 'MockOffline',
        element: lazyMock(() => import('@/mock/app/(others)/offline')),
      },
    ]
  : [];
