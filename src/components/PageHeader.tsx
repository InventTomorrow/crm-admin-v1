import { Link } from 'react-router';
import { LuChevronRight } from 'react-icons/lu';
import { appName } from '@/helpers/constants';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** Optional middle breadcrumb segment (e.g. "Tenants" on the detail page). */
  subtitle?: string;
  description?: string;
  /** Primary page action rendered at the end of the header row. */
  action?: ReactNode;
}

/**
 * Tailwick breadcrumb header with an action slot — supersedes PageBreadcrumb
 * on pages that carry a primary action.
 */
export function PageHeader({ title, subtitle, description, action }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
      <div>
        <h4 className="text-lg font-semibold text-default-900">{title}</h4>
        {description && <p className="mt-0.5 text-sm text-default-500">{description}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 text-sm font-semibold md:flex">
          <Link to="/" className="text-sm font-medium text-default-700">
            {appName}
          </Link>
          <LuChevronRight className="size-3.5 flex-shrink-0 text-default-500 rtl:rotate-180" />
          {subtitle && (
            <>
              <span className="text-sm font-medium text-default-700">{subtitle}</span>
              <LuChevronRight className="size-3.5 flex-shrink-0 text-default-500 rtl:rotate-180" />
            </>
          )}
          <span className="text-sm font-medium text-default-700" aria-current="page">
            {title}
          </span>
        </div>
        {action}
      </div>
    </div>
  );
}
