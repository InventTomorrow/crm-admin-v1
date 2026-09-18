export const CSV_EXTENSION = '.csv';

export function stripCsvExtension(fileName: string): string {
  return fileName.trim().replace(/\.csv$/i, '');
}

export function withCsvExtension(fileName: string): string {
  return `${stripCsvExtension(fileName)}${CSV_EXTENSION}`;
}

/** `users` → `users-2026-09-18`, so repeated exports don't overwrite each other. */
export function datedFileName(prefix: string): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}`;
}
