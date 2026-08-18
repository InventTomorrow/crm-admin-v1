import { Suspense } from 'react';
import { Route, Routes } from 'react-router';
import AdminLayout from '@/layouts/AdminLayout';
import PageWrapper from '@/components/PageWrapper';
import ErrorBoundary from '@/components/ErrorBoundary';
import { FullPageSpinner } from '@/components/states';
import { appRoutes, publicRoutes, notFoundRoute } from './Routes';
import { RouteGuard } from './RouteGuard';
import { mockLayoutsRoutes, mockSingleRoutes } from './mockRoutes';

const AppRoutes = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          <Route element={<AdminLayout />}>
            {appRoutes.map(route => (
              <Route
                key={route.path}
                path={route.path}
                element={<RouteGuard permission={route.permission}>{route.element}</RouteGuard>}
              />
            ))}
          </Route>

          {publicRoutes.map(route => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}

          {/* Tailwick demo reference pages — dev only, stripped from prod builds */}
          {mockLayoutsRoutes.map(route => (
            <Route
              key={route.path}
              path={route.path}
              element={<PageWrapper>{route.element}</PageWrapper>}
            />
          ))}
          {mockSingleRoutes.map(route => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}

          <Route path="*" element={notFoundRoute.element} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;
