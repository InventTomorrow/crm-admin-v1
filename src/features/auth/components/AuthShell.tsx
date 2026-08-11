import { Link } from 'react-router';
import PageMeta from '@/components/PageMeta';
import brandIcon from '@/assets/images/brand/asaanrabta-icon.png';
import brandLogo from '@/assets/images/brand/asaanrabta-logo.png';
import { appName } from '@/helpers/constants';
import type { ReactNode } from 'react';

interface AuthShellProps {
  metaTitle: string;
  heading: string;
  subheading: string;
  children: ReactNode;
}

/** Tailwick "basic" auth layout: centered card over the grid-pattern backdrop. */
export function AuthShell({ metaTitle, heading, subheading, children }: AuthShellProps) {
  return (
    <>
      <PageMeta title={metaTitle} />
      <div className="relative flex min-h-screen w-full items-center justify-center py-16 md:py-10">
        <div className="card z-10 w-screen md:w-lg">
          <div className="px-6 py-12 text-center sm:px-10">
            <Link to="/login" className="flex items-center justify-center">
              <img src={brandLogo} alt={appName} className="block h-9 w-auto dark:hidden" />
              <span className="hidden items-center gap-2.5 dark:flex">
                <img src={brandIcon} alt="" className="size-8 rounded-md" />
                <span className="text-lg font-semibold text-white">
                  Asaan<span className="text-primary">Rabta</span>
                </span>
              </span>
            </Link>

            <div className="mt-8 text-center">
              <h4 className="mb-2.5 text-xl font-semibold text-primary">{heading}</h4>
              <p className="text-base text-default-500">{subheading}</p>
            </div>

            {children}
          </div>
        </div>

        <div className="absolute inset-0 overflow-hidden">
          <svg
            aria-hidden="true"
            className="absolute inset-0 size-full fill-black/2 stroke-black/5 dark:fill-white/2.5 dark:stroke-white/2.5"
          >
            <defs>
              <pattern
                id="authPattern"
                width="56"
                height="56"
                patternUnits="userSpaceOnUse"
                x="50%"
                y="16"
              >
                <path d="M.5 56V.5H72" fill="none"></path>
              </pattern>
            </defs>
            <rect width="100%" height="100%" strokeWidth="0" fill="url(#authPattern)"></rect>
          </svg>
        </div>
      </div>
    </>
  );
}
