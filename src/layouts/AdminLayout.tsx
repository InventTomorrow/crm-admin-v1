import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import Footer from '@/components/layouts/Footer';
import Sidebar from '@/components/layouts/SideNav';
import Topbar from '@/components/layouts/topbar';
import Customizer from '@/components/layouts/customizer';
import { RouteProgressBar } from '@/components/RouteProgressBar';
import { FullPageSpinner } from '@/components/states';
import { useMe } from '@/features/auth/auth.hooks';

/**
 * Guarded admin shell: verifies the session, then mounts the Tailwick chrome
 * once around all app routes (sidebar/topbar/footer/customizer).
 */
const AdminLayout = () => {
  const { data: signedInAdmin, isLoading, isError } = useMe();

  /**
   * The chrome renders only once the session resolves, which is normally after
   * ProvidersWrapper has already run Preline's autoInit against a page holding
   * nothing but the spinner. Nothing re-inits afterwards — the route-change
   * effect there sees the same location — so the topbar dropdowns would never
   * bind on a fresh load. Re-init once the markup they attach to exists.
   */
  useEffect(() => {
    if (signedInAdmin && window.HSStaticMethods) {
      window.HSStaticMethods.autoInit();
    }
  }, [signedInAdmin]);

  if (isLoading) return <FullPageSpinner />;
  if (isError || !signedInAdmin) return <Navigate to="/login" replace />;

  return (
    <>
      <RouteProgressBar />
      <div className="wrapper">
        <Sidebar />
        <div className="page-content">
          <Topbar />
          {/* ActiveOfferStrip stays unmounted until /admin/promo-offers ships. */}
          <Outlet />
          <Footer />
        </div>
      </div>
      <Customizer />
    </>
  );
};

export default AdminLayout;
