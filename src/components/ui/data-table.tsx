import { Dropdown, DropdownLabel } from '@/components/ui/dropdown';
import { EmptyState, ErrorState, TableRowsSkeleton } from '@/components/states';
import { cn } from '@/lib/utils';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { AnimatePresence, motion } from 'framer-motion';
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button, buttonVariants } from './button';
import {
  LuArrowDown,
  LuArrowUp,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
  LuChevronsUpDown,
  LuLayoutGrid,
  LuRows3,
  LuSearch,
  LuSlidersHorizontal,
} from 'react-icons/lu';

const PAGE_SIZES = [10, 20, 30, 50, 100];

export type DataTableView = 'table' | 'grid';

const VIEW_OPTIONS = [
  { value: 'table', label: 'Table view', icon: LuRows3 },
  { value: 'grid', label: 'Grid view', icon: LuLayoutGrid },
] as const satisfies readonly { value: DataTableView; label: string; icon: typeof LuRows3 }[];

/** Both views cross-fade in place, so switching never jumps the page. */
const VIEW_TRANSITION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.18, ease: 'easeOut' },
} as const;

/** Native checkbox that supports the indeterminate visual state. */
function IndeterminateCheckbox({
  indeterminate = false,
  className,
  ...rest
}: { indeterminate?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  const checkboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = !rest.checked && indeterminate;
  }, [indeterminate, rest.checked]);
  return (
    <input type="checkbox" ref={checkboxRef} className={cn('form-checkbox', className)} {...rest} />
  );
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyMessage?: string;
  enableSelection?: boolean;
  /** Filter controls (selects) rendered next to the search input. */
  toolbarFilters?: ReactNode;
  /** Primary action rendered at the toolbar's end (e.g. a create button). */
  toolbarAction?: ReactNode;
  /** Rendered when one or more rows are selected. Receives the selected row ids
   *  (requires `getRowId`) and a `clear` callback to reset the selection. */
  renderBulkActions?: (selectedIds: string[], clear: () => void) => ReactNode;
  getRowId?: (row: TData) => string;
  onRowClick?: (row: TData) => void;
  renderExpandedRow?: (row: TData) => ReactNode;
  /** When true, clicking the row toggles the accordion (no chevron column shown). */
  expandOnRowClick?: boolean;
  /** When true, odd/even rows get alternating backgrounds. */
  alternatingRows?: boolean;
  /** Optional extra className per row (e.g. for special-case highlighting). */
  getRowClassName?: (row: TData) => string;
  /** Supplying this turns on the table/grid switch and renders each card. */
  renderGridItem?: (row: TData) => ReactNode;
  /** Grid track overrides; defaults to 1/2/3 columns. */
  gridClassName?: string;
  /** Which view the switch starts on. */
  defaultView?: DataTableView;
}

export function DataTable<TData>({
  columns,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  isLoading,
  isError,
  error,
  onRetry,
  emptyMessage = 'No results.',
  enableSelection = false,
  toolbarFilters,
  toolbarAction,
  renderBulkActions,
  getRowId,
  onRowClick,
  renderExpandedRow,
  expandOnRowClick = false,
  alternatingRows = false,
  getRowClassName,
  renderGridItem,
  gridClassName,
  defaultView = 'table',
}: DataTableProps<TData>) {
  const [view, setView] = useState<DataTableView>(defaultView);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  // Sorts the rows of the current page (lists paginate server-side).
  const [sorting, setSorting] = useState<SortingState>([]);

  const selectionColumn: ColumnDef<TData, unknown> = {
    id: 'select',
    enableHiding: false,
    header: ({ table }) => (
      <IndeterminateCheckbox
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={event => table.toggleAllRowsSelected(event.target.checked)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <IndeterminateCheckbox
        checked={row.getIsSelected()}
        onChange={event => row.toggleSelected(event.target.checked)}
        onClick={event => event.stopPropagation()}
        aria-label="Select row"
      />
    ),
  };

  const expandColumn: ColumnDef<TData, unknown> = {
    id: 'expand',
    enableHiding: false,
    header: () => <div className="w-6" />,
    cell: ({ row }) => {
      const rowId = getRowId ? getRowId(row.original) : (row.id ?? String(row.index));
      const isExpanded = !!expandedRows[rowId];
      return (
        <button
          type="button"
          aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
          className="btn size-7 bg-default-100 text-default-500 hover:bg-default-200"
          onClick={event => {
            event.stopPropagation();
            setExpandedRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
          }}
        >
          {isExpanded ? (
            <LuChevronDown className="size-4" />
          ) : (
            <LuChevronRight className="size-4 rtl:rotate-180" />
          )}
        </button>
      );
    },
  };

  const tableColumns = useMemo(() => {
    let cols = [...columns];
    if (enableSelection) {
      cols = [selectionColumn, ...cols];
    }
    // Only add the chevron column when NOT using row-click-to-expand
    if (renderExpandedRow && !expandOnRowClick) {
      cols = [expandColumn, ...cols];
    }
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- expandedRows drives the chevron cell renders
  }, [columns, enableSelection, renderExpandedRow, expandOnRowClick, expandedRows]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
    state: {
      rowSelection,
      columnVisibility,
      sorting,
      pagination: { pageIndex: page - 1, pageSize },
    },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    enableRowSelection: enableSelection,
    getRowId: getRowId ? row => getRowId(row) : undefined,
  });

  const selectedIds = Object.keys(rowSelection);
  const selectedCount = selectedIds.length;
  const showBulkActions = Boolean(enableSelection && renderBulkActions && selectedCount > 0);
  const clearSelection = () => setRowSelection({});

  const hideableColumns = table.getAllColumns().filter(column => column.getCanHide());
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const paginationButton = buttonVariants({ variant: 'outline', size: 'icon-sm' });

  return (
    <div className="card">
      {/*
        A single toolbar row whose contents swap on selection. Rendering the
        bulk actions as their own bar above the toolbar pushed the whole table
        down the moment a row was ticked, so every selection jerked the layout.
        min-h keeps the row the same height in both states.
      */}
      <div className="card-header flex min-h-15 flex-wrap items-center justify-between gap-3">
        {showBulkActions ? (
          <span className="text-sm font-medium text-primary">{selectedCount} selected</span>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {onSearchChange && (
              <div className="relative">
                <input
                  type="text"
                  value={search ?? ''}
                  onChange={event => onSearchChange(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="form-input form-input-sm ps-9 min-w-56"
                />
                <div className="absolute inset-y-0 start-0 flex items-center ps-3">
                  <LuSearch className="size-3.5 text-default-500" />
                </div>
              </div>
            )}
            {toolbarFilters}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {showBulkActions && renderBulkActions ? (
            <>
              {renderBulkActions(selectedIds, clearSelection)}
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            </>
          ) : (
            toolbarAction
          )}
          {renderGridItem && (
            <div
              role="group"
              aria-label="Switch view"
              className="relative flex items-center gap-0.5 rounded-lg bg-default-100 p-0.5"
            >
              {VIEW_OPTIONS.map(option => {
                const isActive = view === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    title={option.label}
                    aria-label={option.label}
                    aria-pressed={isActive}
                    onClick={() => setView(option.value)}
                    className={cn(
                      'relative inline-flex size-7 items-center justify-center rounded-md transition-colors',
                      isActive ? 'text-primary' : 'text-default-500 hover:text-default-700'
                    )}
                  >
                    {/* The pill slides between the two buttons rather than cutting. */}
                    {isActive && (
                      <motion.span
                        layoutId="data-table-view-pill"
                        className="absolute inset-0 rounded-md bg-card shadow-sm"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <option.icon className="relative size-4" />
                  </button>
                );
              })}
            </div>
          )}

          <Dropdown
            trigger={<LuSlidersHorizontal className="size-4" />}
            triggerLabel="Toggle columns"
            triggerClassName={cn(
              'btn size-7.5 bg-default-100 text-default-500 hover:bg-default-200',
              view === 'grid' && 'hidden'
            )}
            menuClassName="w-44"
          >
            <DropdownLabel>Toggle columns</DropdownLabel>
            <div className="pt-1">
              {hideableColumns.map(column => (
                <label
                  key={column.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-3 py-1.5 text-sm capitalize text-default-600 hover:bg-default-150"
                >
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={column.getIsVisible()}
                    onChange={event => column.toggleVisibility(event.target.checked)}
                  />
                  {column.id}
                </label>
              ))}
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableRowsSkeleton rows={Math.min(pageSize, 8)} cols={Math.min(tableColumns.length, 6)} />
      ) : isError ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : data.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {view === 'grid' && renderGridItem ? (
            <motion.div key="grid" {...VIEW_TRANSITION}>
              <div className={cn('grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3', gridClassName)}>
                {data.map((row, index) => (
                  <motion.div
                    key={getRowId ? getRowId(row) : index}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: Math.min(index, 8) * 0.035 }}
                  >
                    {renderGridItem(row)}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="table" {...VIEW_TRANSITION} className="overflow-x-auto">
              <div className="min-w-full inline-block align-middle">
                <table className="min-w-full divide-y divide-default-200">
                  <thead className="bg-default-150">
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr
                        key={headerGroup.id}
                        className="text-sm font-normal text-default-700 whitespace-nowrap"
                      >
                        {headerGroup.headers.map(header => {
                          const canSort = header.column.getCanSort();
                          const sortDirection = header.column.getIsSorted();
                          return (
                            <th
                              key={header.id}
                              className={cn(
                                'text-start',
                                header.column.id === 'select' ? 'ps-4' : 'px-3.5 py-3'
                              )}
                              aria-sort={
                                sortDirection === 'asc'
                                  ? 'ascending'
                                  : sortDirection === 'desc'
                                    ? 'descending'
                                    : undefined
                              }
                            >
                              {header.isPlaceholder ? null : canSort ? (
                                <button
                                  type="button"
                                  className="group inline-flex items-center gap-1.5 hover:text-default-900"
                                  onClick={header.column.getToggleSortingHandler()}
                                >
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                  {sortDirection === 'asc' ? (
                                    <LuArrowUp className="size-3.5 text-primary" />
                                  ) : sortDirection === 'desc' ? (
                                    <LuArrowDown className="size-3.5 text-primary" />
                                  ) : (
                                    <LuChevronsUpDown className="size-3.5 text-default-400 opacity-0 transition-opacity group-hover:opacity-100" />
                                  )}
                                </button>
                              ) : (
                                flexRender(header.column.columnDef.header, header.getContext())
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-default-200">
                    {table.getRowModel().rows.map((row, rowIndex) => {
                      const rowId = getRowId
                        ? getRowId(row.original)
                        : (row.id ?? String(row.index));
                      const isExpanded = !!expandedRows[rowId];
                      const isEven = alternatingRows && rowIndex % 2 === 1;

                      const handleRowClick = () => {
                        if (expandOnRowClick && renderExpandedRow) {
                          setExpandedRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
                        } else if (onRowClick) {
                          onRowClick(row.original);
                        }
                      };

                      return (
                        <Fragment key={row.id}>
                          <tr
                            className={cn(
                              'text-sm font-normal text-default-800 whitespace-nowrap',
                              ((expandOnRowClick && renderExpandedRow) || onRowClick) &&
                                'cursor-pointer hover:bg-default-50',
                              isExpanded
                                ? 'bg-primary/5 border-s-2 border-s-primary'
                                : isEven && 'bg-default-50',
                              getRowClassName?.(row.original)
                            )}
                            onClick={handleRowClick}
                          >
                            {row.getVisibleCells().map(cell => (
                              <td
                                key={cell.id}
                                className={cn(
                                  cell.column.id === 'select' ? 'py-3 ps-4' : 'px-3.5 py-3'
                                )}
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                          {isExpanded && renderExpandedRow && (
                            <tr>
                              <td colSpan={table.getVisibleFlatColumns().length} className="p-0">
                                <div className="border-b border-default-200 bg-default-50 p-4">
                                  {renderExpandedRow(row.original)}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Footer / pagination */}
      <div className="card-footer flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-default-500">
            {enableSelection && selectedCount > 0 ? `${selectedCount} selected · ` : ''}
            Showing <b>{rangeStart}</b>–<b>{rangeEnd}</b> of <b>{total}</b> Results
          </p>
          <select
            aria-label="Rows per page"
            className="form-input form-input-sm w-auto"
            value={pageSize}
            onChange={event => onPageSizeChange(Number(event.target.value))}
          >
            {PAGE_SIZES.map(size => (
              <option key={size} value={size}>
                {size} rows
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
            className={paginationButton}
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
            className={paginationButton}
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
