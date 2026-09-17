import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useDebounce } from './useDebounce';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SEARCH_DELAY = 350;

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
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearchInput: (value: string) => void;
  setFilter: (key: TFilterKey, value: string) => void;
  /** Clears the search box and every filter, and returns to page 1. */
  resetAll: () => void;
  /** How many filters (plus the search) are currently narrowing the list. */
  activeCount: number;
}

/**
 * One place for the page / page-size / search / filter state every admin list
 * needs, mirrored into the URL so a filtered view survives a refresh, the back
 * button and being pasted to someone else.
 *
 * Defaults are kept out of the query string, so an untouched list has a clean
 * URL. Changing the search or any filter resets to page 1 — paging is only
 * meaningful against a fixed result set.
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
  const paramName = useCallback(
    (key: string) => (namespace ? `${namespace}_${key}` : key),
    [namespace]
  );

  const page = Number(searchParams.get(paramName('page')) ?? 1) || 1;
  const pageSize =
    Number(searchParams.get(paramName('size')) ?? defaultPageSize) || defaultPageSize;
  const searchFromUrl = searchParams.get(paramName('q')) ?? '';

  // The box stays instant while the URL and the query only take the settled
  // value, so typing never floods history or fires a request per keystroke.
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const search = useDebounce(searchInput, searchDelay);

  const filterKeys = useMemo(
    () => Object.keys(filterDefaults) as TFilterKey[],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keys are static per call site
    [JSON.stringify(filterDefaults)]
  );

  const filters = useMemo(() => {
    const resolved = {} as Record<TFilterKey, string>;
    for (const key of filterKeys) {
      resolved[key] = searchParams.get(paramName(key)) ?? filterDefaults[key];
    }
    return resolved;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterDefaults is static per call site
  }, [searchParams, filterKeys, paramName]);

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
    setPage,
    setPageSize,
    setSearchInput,
    setFilter,
    resetAll,
    activeCount,
  };
}
