import type { SortingState } from '@tanstack/react-table';
import type { ListSort } from './useListQueryState';

type SortOrder = 'asc' | 'desc';

interface ServerSortingOptions<TField extends string> {
  /** The list's URL-backed state — the sort lives there so it persists with page and filters. */
  listQuery: { sort: ListSort | null; setSort: (sort: ListSort | null) => void };
  /** Column ids that double as the server's `sortBy` keys. */
  sortableFields: readonly TField[];
  /** Omit to let the server apply its own default order. */
  defaultSort?: { id: TField; desc: boolean };
}

export function useServerSorting<TField extends string>({
  listQuery,
  sortableFields,
  defaultSort,
}: ServerSortingOptions<TField>) {
  // A sort id from a hand-edited or stale URL is ignored rather than sent to the server.
  const urlSort =
    listQuery.sort && sortableFields.includes(listQuery.sort.id as TField) ? listQuery.sort : null;
  const activeSort = urlSort ?? defaultSort;

  const sorting: SortingState = activeSort ? [activeSort] : [];
  const sortBy = activeSort?.id as TField | undefined;
  const sortOrder: SortOrder = activeSort?.desc === false ? 'asc' : 'desc';

  // Setting the sort also resets to page 1 — a re-sorted list reshuffles every page.
  const onSortingChange = (nextSorting: SortingState) => {
    const nextSort = nextSorting[0];
    listQuery.setSort(nextSort ? { id: nextSort.id, desc: nextSort.desc } : null);
  };

  return { sorting, onSortingChange, sortBy, sortOrder };
}
