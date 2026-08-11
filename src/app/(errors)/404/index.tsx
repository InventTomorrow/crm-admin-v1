import AuthBgDark from '@/assets/images/auth-bg-dark.jpg';
import AuthBg from '@/assets/images/auth-bg.jpg';
import brandIcon from '@/assets/images/brand/asaanrabta-icon.png';
import brandLogo from '@/assets/images/brand/asaanrabta-logo.png';
import Error404 from '@/assets/images/error-404.png';
import PageMeta from '@/components/PageMeta';
import { appName } from '@/helpers/constants';
import { LuHouse } from 'react-icons/lu';
import { Link } from 'react-router';

const PageNotFound = () => {
  return (
    <>
      <PageMeta title="Page Not Found" />
      <div className="relative h-screen w-full flex justify-center items-center">
        <div className="absolute inset-0">
          <div className="block dark:hidden h-full w-full">
            <img src={AuthBg} alt="background" className="object-cover" />
          </div>
          <div className="hidden dark:block h-full w-full">
            <img src={AuthBgDark} alt="background dark" className="object-cover" />
          </div>
        </div>

        <div className="relative z-10 bg-default-50 rounded-lg w-lg">
          <div className="text-center px-10 py-12">
            <Link to="/" className="flex items-center justify-center">
              <img src={brandLogo} alt={appName} className="block h-8 w-auto dark:hidden" />
              <span className="hidden items-center gap-2.5 dark:flex">
                <img src={brandIcon} alt="" className="size-8 rounded-md" />
                <span className="text-lg font-semibold text-white">
                  Asaan<span className="text-primary">Rabta</span>
                </span>
              </span>
            </Link>

            <div className="mt-10">
              <div className="h-64 relative w-auto mx-auto">
                <img src={Error404} alt="404 error" className="h-64 mx-auto" />
              </div>
            </div>

            <div className="mt-8 text-center">
              <h4 className="mb-2 text-default-900 text-xl font-semibold">Page not found</h4>
              <p className="mb-6 text-base text-default-500">
                The page you are looking for does not exist or has been moved.
              </p>
              <Link to="/">
                <button
                  type="button"
                  className="bg-primary text-white hover:bg-primary/90 rounded text-[13px] py-2 px-4 inline-flex items-center"
                >
                  <LuHouse className="size-3 me-1" />
                  Back to dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PageNotFound;
