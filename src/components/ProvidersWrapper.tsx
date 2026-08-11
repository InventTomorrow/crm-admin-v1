import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLocation } from 'react-router';
import { Toaster } from 'sonner';

import LayoutProvider, { useLayoutContext } from '@/context/useLayoutContext';

/** Sonner needs the layout theme, so it mounts inside LayoutProvider. */
const ThemedToaster = () => {
  const { theme } = useLayoutContext();
  return <Toaster richColors position="top-right" theme={theme} />;
};

const ProvidersWrapper = ({ children }: { children: React.ReactNode }) => {
  const path = useLocation();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Preline powers only the static chrome (sidenav accordion, topbar dropdowns,
  // customizer). Data-driven overlays are React-controlled, so a re-init on
  // route change is enough — no DOM observer.
  useEffect(() => {
    import('preline/preline').then(() => {
      if (window.HSStaticMethods) {
        window.HSStaticMethods.autoInit();
      }
    });
  }, []);

  useEffect(() => {
    if (window.HSStaticMethods) {
      window.HSStaticMethods.autoInit();
    }
  }, [path]);

  return (
    <QueryClientProvider client={queryClient}>
      <LayoutProvider>
        {children}
        <ThemedToaster />
      </LayoutProvider>
    </QueryClientProvider>
  );
};

export default ProvidersWrapper;
