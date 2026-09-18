// Per-tab (sessionStorage) so a list's page/filters/sort survive navigation but vanish with the tab.
const STORAGE_PREFIX = 'listState:';

export type ListParamSnapshot = Record<string, string>;

export function readListState(listKey: string): ListParamSnapshot | null {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_PREFIX + listKey);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    // Only string values are ever written; anything else is tampering or a stale format.
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string'
      )
    );
  } catch {
    return null;
  }
}

export function writeListState(listKey: string, snapshot: ListParamSnapshot): void {
  try {
    if (Object.keys(snapshot).length === 0) {
      window.sessionStorage.removeItem(STORAGE_PREFIX + listKey);
      return;
    }
    window.sessionStorage.setItem(STORAGE_PREFIX + listKey, JSON.stringify(snapshot));
  } catch {
    // Storage full or blocked (private mode) — the list still works, it just won't be remembered.
  }
}

/** Searches can hold customer emails/phones, so nothing is left behind once the admin signs out. */
export function clearAllListState(): void {
  try {
    const storage = window.sessionStorage;
    const listKeys: string[] = [];
    for (let index = 0; index < storage.length; index++) {
      const storageKey = storage.key(index);
      if (storageKey?.startsWith(STORAGE_PREFIX)) listKeys.push(storageKey);
    }
    listKeys.forEach(storageKey => storage.removeItem(storageKey));
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
