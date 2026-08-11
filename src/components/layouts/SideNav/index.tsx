import { Link } from 'react-router';
import SimplebarClient from '@/components/client-wrapper/SimplebarClient';
import brandIcon from '@/assets/images/brand/asaanrabta-icon.png';
import brandLogo from '@/assets/images/brand/asaanrabta-logo.png';
import { appName } from '@/helpers/constants';
import AppMenu from './AppMenu';
import HoverToggle from './HoverToggle';

const Sidebar = () => {
  return (
    <aside id="app-menu" className="app-menu">
      <Link
        to="/"
        className="logo-box sticky top-0 flex min-h-topbar-height items-center justify-start px-6 backdrop-blur-xs"
      >
        {/* Light sidenav — full wordmark logo (dark text) */}
        <div className="logo-dark">
          <img src={brandLogo} alt={appName} className="logo-lg h-8 w-auto" />
          <img src={brandIcon} alt={appName} className="logo-sm size-8 rounded-md" />
        </div>

        {/* Dark sidenav / dark theme — icon + light wordmark */}
        <div className="logo-light">
          <span className="logo-lg flex items-center gap-2.5">
            <img src={brandIcon} alt="" className="size-8 rounded-md" />
            <span className="text-lg font-semibold text-white">
              Asaan<span className="text-primary">Rabta</span>
            </span>
          </span>
          <img src={brandIcon} alt={appName} className="logo-sm size-8 rounded-md" />
        </div>
      </Link>

      <HoverToggle />

      <div className="relative min-h-0 flex-grow">
        <SimplebarClient className="size-full">
          <AppMenu />
        </SimplebarClient>
      </div>
    </aside>
  );
};

export default Sidebar;
