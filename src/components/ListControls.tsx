import type { ReactNode } from 'react';
import {
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
  LuFilterX,
  LuSearch,
} from 'react-icons/lu';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PAGE_SIZES = [12, 24, 48, 96];

interface ListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  activeFilterCount?: number;
  onResetFilters?: () => void;
  action?: ReactNode;
}

/** Search + filter row for the card-grid pages, which don't use DataTable. */
export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  activeFilterCount = 0,
  onResetFilters,
  action,
}: ListToolbarProps) {
  return (
    <div className="card mb-4">
      <div className="card-header flex min-h-15 flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={event => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="form-input form-input-sm ps-9 min-w-56"
            />
            <div className="absolute inset-y-0 start-0 flex items-center ps-3">
              <LuSearch className="size-3.5 text-default-500" />
            </div>
          </div>
          {filters}
          {onResetFilters && activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onResetFilters}>
              <LuFilterX className="size-4 me-1" /> Clear ({activeFilterCount})
            </Button>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}

interface ListPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function ListPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: ListPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const iconButton = buttonVariants({ variant: 'outline', size: 'icon-sm' });

  // A single page of results needs no controls at all.
  if (total <= pageSize && page === 1) return null;

  return (
    <div className="card mt-4">
      <div className="card-footer flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-default-500">
            Showing <b>{rangeStart}</b>–<b>{rangeEnd}</b> of <b>{total}</b> Results
          </p>
          <select
            aria-label="Cards per page"
            className="form-input form-input-sm w-auto"
            value={pageSize}
            onChange={event => onPageSizeChange(Number(event.target.value))}
          >
            {PAGE_SIZES.map(size => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        </div>

        <nav className="flex flex-wrap items-center gap-2" aria-label="Pagination">
          <span className="me-1 text-sm text-default-500">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            aria-label="First page"
            className={iconButton}
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
          >
            <LuChevronsLeft className="size-4 rtl:rotate-180" />
          </button>
          <button
            type="button"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-auto px-2.5')}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <LuChevronLeft className="size-4 me-1 rtl:rotate-180" /> Prev
          </button>
          <button
            type="button"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-auto px-2.5')}
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            Next <LuChevronRight className="size-4 ms-1 rtl:rotate-180" />
          </button>
          <button
            type="button"
            aria-label="Last page"
            className={iconButton}
            disabled={page >= pageCount}
            onClick={() => onPageChange(pageCount)}
          >
            <LuChevronsRight className="size-4 rtl:rotate-180" />
          </button>
        </nav>
      </div>
    </div>
  );
}
