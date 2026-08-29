import { GlobalSearch } from '@/components/GlobalSearch';
import { Badge } from '@/components/ui/badge';
import { useLogout, useMe } from '@/features/auth/auth.hooks';
import { useEffect, useState } from 'react';
import { LuLogOut } from 'react-icons/lu';
import { TbSearch } from 'react-icons/tb';
import { useNavigate } from 'react-router';
import NotificationsDropdown from './NotificationsDropdown';
import SidenavToggle from './SidenavToggle';
import ThemeModeToggle from './ThemeModeToggle';

const adminInitials = (firstName: string | null, lastName: string | null, email: string) => {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  return initials || email[0]?.toUpperCase() || '?';
};

const Topbar = () => {
  const navigate = useNavigate();
  const { data: signedInAdmin } = useMe();
  const logoutMutation = useLogout();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  const handleSignOut = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => navigate('/login', { replace: true }),
    });
  };

  return (
    <div className="app-header min-h-topbar-height flex items-center sticky top-0 z-30 bg-(--topbar-background) border-b border-default-200">
      <div className="w-full flex items-center justify-between px-6">
        <div className="flex items-center gap-5">
          <SidenavToggle />

          {/* Search opens the ⌘K palette */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="lg:flex hidden items-center gap-3 form-input w-60 rounded border-transparent text-default-400 text-sm cursor-pointer hover:border-default-200"
          >
            <div className="flex items-center gap-2 font-medium text-default-400 min-w-[200px]">
              <TbSearch className="text-base" />
              <span className="flex-grow text-start">Search…</span>
            </div>
          </button>
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="lg:hidden btn btn-icon size-8 hover:bg-default-150 rounded-full"
          >
            <TbSearch className="size-4.5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* TopbarOfferControl stays unmounted until /admin/promo-offers ships. */}
          <ThemeModeToggle />

          <NotificationsDropdown />

          {/* <div className="topbar-item">
            <button
              className="btn btn-icon size-8 hover:bg-default-150 rounded-full"
              type="button"
              aria-haspopup="dialog"
              aria-expanded="false"
              aria-controls="theme-customization"
              data-hs-overlay="#theme-customization"
              aria-label="Layout settings"
            >
              <LuSettings className="size-4.5" />
            </button>
          </div> */}

          <div className="topbar-item hs-dropdown relative inline-flex">
            <button
              type="button"
              aria-label="Account menu"
              className="hs-dropdown-toggle flex size-9.5 cursor-pointer items-center justify-center rounded-full bg-primary font-semibold text-white"
            >
              {signedInAdmin
                ? adminInitials(
                    signedInAdmin.firstName,
                    signedInAdmin.lastName,
                    signedInAdmin.email
                  )
                : '…'}
            </button>
            <div className="hs-dropdown-menu min-w-56">
              <div className="p-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded bg-primary/10 font-semibold text-primary">
                    {signedInAdmin
                      ? adminInitials(
                          signedInAdmin.firstName,
                          signedInAdmin.lastName,
                          signedInAdmin.email
                        )
                      : '…'}
                  </div>
                  <div className="min-w-0">
                    <h6 className="mb-0.5 truncate text-sm font-semibold text-default-800">
                      {signedInAdmin
                        ? `${signedInAdmin.firstName ?? ''} ${signedInAdmin.lastName ?? ''}`.trim() ||
                          signedInAdmin.email
                        : '—'}
                    </h6>
                    <p className="truncate text-xs text-default-500">{signedInAdmin?.email}</p>
                  </div>
                </div>
                {signedInAdmin && (
                  <div className="mt-2">
                    <Badge
                      tone={signedInAdmin.systemRole === 'SYSTEM_ADMIN' ? 'primary' : 'neutral'}
                    >
                      {signedInAdmin.systemRole === 'SYSTEM_ADMIN'
                        ? 'System admin'
                        : 'System manager'}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="border-t border-default-200 -mx-2 my-2"></div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={logoutMutation.isPending}
                className="flex w-full items-center gap-x-3.5 rounded px-3 py-1.5 font-medium text-danger hover:bg-danger/10"
              >
                <LuLogOut className="size-4" />
                {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};

export default Topbar;
