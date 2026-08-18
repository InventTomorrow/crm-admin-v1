import { Link } from 'react-router';
import { LuCircleAlert, LuLoaderCircle, LuLock, LuSearchX } from 'react-icons/lu';
import { buttonVariants } from '@/components/ui/button';
import { apiMessage } from '@/lib/apiClient';

/** Full-viewport spinner — route Suspense fallback and the auth guard. */
export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LuLoaderCircle className="size-8 animate-spin text-default-500" />
    </div>
  );
}

/** Centered spinner for in-card loading. */
export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <LuLoaderCircle className="size-6 animate-spin text-default-500" />
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error?: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <LuCircleAlert className="size-8 text-danger" />
      <p className="text-sm text-default-500">{apiMessage(error)}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn btn-sm bg-danger/10 text-danger hover:bg-danger hover:text-white"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Shown by RouteGuard when a role reaches a page it has no permission for —
 * by typing the URL, or following a stale link after a role change.
 */
export function AccessDeniedState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="card flex max-w-sm flex-col items-center gap-3 p-8 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-default-100 text-default-500">
          <LuLock className="size-5" />
        </span>
        <h2 className="text-base font-semibold text-default-800">You don't have access</h2>
        <p className="text-sm text-default-500">
          Your role doesn't include permission to view this page. Ask a system admin if you need
          access.
        </p>
        <Link to="/" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export function EmptyState({ message = 'No results found.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <LuSearchX className="size-8 text-default-400" />
      <p className="text-sm text-default-500">{message}</p>
    </div>
  );
}

/** Striped skeleton rows rendered inside DataTable while a page loads. */
export function TableRowsSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-11 bg-default-150" />
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid items-center gap-4 border-t border-default-200 px-4 py-3.5"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 rounded bg-default-200" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Full-page table skeleton: toolbar + rows + footer. */
export function TableSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="card-header flex items-center justify-between gap-3">
        <div className="h-9 w-64 rounded bg-default-200" />
        <div className="h-9 w-32 rounded bg-default-200" />
      </div>
      <TableRowsSkeleton />
      <div className="card-footer flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-default-200" />
        <div className="h-8 w-48 rounded bg-default-200" />
      </div>
    </div>
  );
}

function CardBlockSkeleton({ className = 'h-40' }: { className?: string }) {
  return (
    <div className="card">
      <div className="card-body">
        <div className={`animate-pulse rounded bg-default-200 ${className}`} />
      </div>
    </div>
  );
}

/** KPI row + charts placeholder matching the dashboard layout. */
export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-5">
      {Array.from({ length: 4 }).map((_, kpiIndex) => (
        <div key={kpiIndex} className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="card animate-pulse">
            <div className="card-body flex items-center gap-3">
              <div className="size-12 rounded bg-default-200" />
              <div className="space-y-2">
                <div className="h-5 w-20 rounded bg-default-200" />
                <div className="h-3.5 w-24 rounded bg-default-150" />
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="col-span-12 xl:col-span-8">
        <CardBlockSkeleton className="h-72" />
      </div>
      <div className="col-span-12 xl:col-span-4">
        <CardBlockSkeleton className="h-72" />
      </div>
      <div className="col-span-12">
        <CardBlockSkeleton className="h-56" />
      </div>
    </div>
  );
}

/** Header card + tabbed table placeholder for the tenant detail page. */
export function TenantDetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="card animate-pulse">
        <div className="card-body flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-48 rounded bg-default-200" />
            <div className="h-4 w-72 rounded bg-default-150" />
          </div>
          <div className="h-9 w-36 rounded bg-default-200" />
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <div className="mb-4 flex gap-4">
            {Array.from({ length: 3 }).map((_, tabIndex) => (
              <div key={tabIndex} className="h-8 w-28 animate-pulse rounded bg-default-200" />
            ))}
          </div>
          <TableRowsSkeleton rows={4} cols={4} />
        </div>
      </div>
    </div>
  );
}

/** Expanded user row placeholder while GET /users/:id resolves. */
export function UserDetailAccordionSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 md:grid-cols-2">
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, lineIndex) => (
          <div key={lineIndex} className="h-4 w-3/4 rounded bg-default-200" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-4 w-1/2 rounded bg-default-200" />
        <div className="h-24 rounded bg-default-150" />
      </div>
    </div>
  );
}
