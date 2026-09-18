import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { readListState, writeListState, type ListParamSnapshot } from './listStateStorage';
import { useDebounce } from './useDebounce';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SEARCH_DELAY = 350;

export interface ListSort {
  id: string;
  desc: boolean;
}

export interface ListQueryStateOptions<TFilterKey extends string> {
  /** Filter keys mapped to the value that means "not filtering". */
  filters?: Record<TFilterKey, string>;
  defaultPageSize?: number;
  searchDelay?: number;
  /** Prefix for the URL params, needed only when one route hosts two lists. */
  namespace?: string;
}

export interface ListQueryState<TFilterKey extends string> {
  page: number;
  pageSize: number;
  /** Bind this to the input — updates on every keystroke. */
  searchInput: string;
  /** Debounced; this is what queries and the URL see. */
  search: string;
  filters: Record<TFilterKey, string>;
  /** Null until a column is clicked — callers fall back to their default order. */
  sort: ListSort | null;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearchInput: (value: string) => void;
  setFilter: (key: TFilterKey, value: string) => void;
  setSort: (sort: ListSort | null) => void;
  /** Clears the search box and every filter, and returns to page 1. */
  resetAll: () => void;
  /** How many filters (plus the search) are currently narrowing the list. */
  activeCount: number;
}

/**
 * One place for the page / page-size / search / filter / sort state every admin
 * list needs, mirrored into the URL so a view survives a refresh, the back
 * button and being pasted to someone else.
 *
 * The URL is also saved per list for the tab's lifetime: arriving with a bare
 * URL (e.g. from the sidebar) restores the last page, filters and sort. A URL
 * that already carries list params always wins over the saved copy.
 *
 * Defaults are kept out of the query string, so an untouched list has a clean
 * URL. Changing the search, a filter or the sort resets to page 1 — paging is
 * only meaningful against a fixed result set.
 */
export function useListQueryState<TFilterKey extends string = never>(
  options: ListQueryStateOptions<TFilterKey> = {}
): ListQueryState<TFilterKey> {
  const {
    filters: filterDefaults = {} as Record<TFilterKey, string>,
    defaultPageSize = DEFAULT_PAGE_SIZE,
    searchDelay = DEFAULT_SEARCH_DELAY,
    namespace,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();
  const listKey = namespace ? `${pathname}#${namespace}` : pathname;

  const paramName = useCallback(
    (key: string) => (namespace ? `${namespace}_${key}` : key),
    [namespace]
  );

  const filterKeys = useMemo(
    () => Object.keys(filterDefaults) as TFilterKey[],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keys are static per call site
    [JSON.stringify(filterDefaults)]
  );

  const ownedParamNames = useMemo(
    () => ['page', 'size', 'q', 'sort', 'dir', ...filterKeys].map(paramName),
    [filterKeys, paramName]
  );

  const snapshotOf = useCallback(
    (params: URLSearchParams): ListParamSnapshot => {
      const snapshot: ListParamSnapshot = {};
      for (const name of ownedParamNames) {
        const value = params.get(name);
        if (value !== null) snapshot[name] = value;
      }
      return snapshot;
    },
    [ownedParamNames]
  );

  // Read once on mount: the saved copy stands in for the URL until it has been written back.
  const [pendingRestore, setPendingRestore] = useState<ListParamSnapshot | null>(() =>
    Object.keys(snapshotOf(searchParams)).length > 0 ? null : readListState(listKey)
  );

  const readParam = useCallback(
    (name: string): string | null =>
      pendingRestore ? (pendingRestore[name] ?? null) : searchParams.get(name),
    [pendingRestore, searchParams]
  );

  const page = Number(readParam(paramName('page')) ?? 1) || 1;
  const pageSize = Number(readParam(paramName('size')) ?? defaultPageSize) || defaultPageSize;
  const searchFromUrl = readParam(paramName('q')) ?? '';
  const sortId = readParam(paramName('sort'));
  const sort: ListSort | null = sortId
    ? { id: sortId, desc: readParam(paramName('dir')) !== 'asc' }
    : null;

  // The box stays instant while the URL and the query only take the settled
  // value, so typing never floods history or fires a request per keystroke.
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const search = useDebounce(searchInput, searchDelay);

  const filters = useMemo(() => {
    const resolved = {} as Record<TFilterKey, string>;
    for (const key of filterKeys) {
      resolved[key] = readParam(paramName(key)) ?? filterDefaults[key];
    }
    return resolved;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterDefaults is static per call site
  }, [readParam, filterKeys, paramName]);

  /** Writes params, dropping any that fell back to their default. */
  const applyParams = useCallback(
    (changes: Record<string, string | null>, replaceHistoryEntry = false) => {
      setSearchParams(
        current => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === '') next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: replaceHistoryEntry }
      );
    },
    [setSearchParams]
  );

  // Write the restored copy into the URL, replacing the entry so Back doesn't land on the bare URL.
  useEffect(() => {
    if (pendingRestore) applyParams(pendingRestore, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, for the mount-time restore only
  }, []);

  // Drop the stand-in only once the URL actually carries the params, so no render sees defaults.
  useEffect(() => {
    if (pendingRestore && Object.keys(snapshotOf(searchParams)).length > 0) {
      setPendingRestore(null);
    }
  }, [pendingRestore, searchParams, snapshotOf]);

  useEffect(() => {
    if (pendingRestore) return;
    writeListState(listKey, snapshotOf(searchParams));
  }, [pendingRestore, searchParams, listKey, snapshotOf]);

  const setPage = useCallback(
    (nextPage: number) =>
      applyParams({ [paramName('page')]: nextPage <= 1 ? null : String(nextPage) }),
    [applyParams, paramName]
  );

  const setPageSize = useCallback(
    (size: number) =>
      applyParams({
        [paramName('size')]: size === defaultPageSize ? null : String(size),
        [paramName('page')]: null,
      }),
    [applyParams, paramName, defaultPageSize]
  );

  const setFilter = useCallback(
    (key: TFilterKey, value: string) =>
      applyParams({
        [paramName(key)]: value === filterDefaults[key] ? null : value,
        [paramName('page')]: null,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterDefaults is static per call site
    [applyParams, paramName]
  );

  const setSort = useCallback(
    (nextSort: ListSort | null) =>
      applyParams({
        [paramName('sort')]: nextSort?.id ?? null,
        [paramName('dir')]: nextSort ? (nextSort.desc ? 'desc' : 'asc') : null,
        [paramName('page')]: null,
      }),
    [applyParams, paramName]
  );

  // Pushing the settled search term into the URL is an effect rather than part
  // of the change handler, because it lands one debounce after the keystroke.
  const lastSyncedSearch = useRef(searchFromUrl);
  useEffect(() => {
    if (search === lastSyncedSearch.current) return;
    lastSyncedSearch.current = search;
    applyParams({ [paramName('q')]: search || null, [paramName('page')]: null }, true);
  }, [search, applyParams, paramName]);

  // A back/forward navigation changes the URL under us — follow it.
  useEffect(() => {
    if (searchFromUrl === lastSyncedSearch.current) return;
    lastSyncedSearch.current = searchFromUrl;
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  const resetAll = useCallback(() => {
    setSearchInput('');
    lastSyncedSearch.current = '';
    const cleared: Record<string, string | null> = {
      [paramName('q')]: null,
      [paramName('page')]: null,
    };
    for (const key of filterKeys) cleared[paramName(key)] = null;
    applyParams(cleared);
  }, [applyParams, paramName, filterKeys]);

  const activeCount =
    (search ? 1 : 0) + filterKeys.filter(key => filters[key] !== filterDefaults[key]).length;

  return {
    page,
    pageSize,
    searchInput,
    search,
    filters,
    sort,
    setPage,
    setPageSize,
    setSearchInput,
    setFilter,
    setSort,
    resetAll,
    activeCount,
  };
}
