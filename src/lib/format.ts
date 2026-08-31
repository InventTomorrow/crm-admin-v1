import { format, formatDistanceToNowStrict } from 'date-fns';

/** "First Last", falling back to "—" when both parts are missing. */
export function formatFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  return [firstName, lastName].filter(Boolean).join(' ') || '—';
}

/**
 * Platform money is PKR — "Rs. 12,500". Used by MRR and payment amounts.
 * A real zero prints as "Rs. 0": only a missing figure reads as a dash, so an
 * account that has genuinely earned nothing can't be mistaken for one whose
 * revenue failed to load.
 */
export function formatMoneyPKR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return `Rs. ${amount.toLocaleString('en-PK')}`;
}

/** "Jan 5, 2026" — table date cells. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return format(new Date(iso), 'MMM d, yyyy');
}

/** "Jan 5, 2026, 4:30 PM" — detail panes. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return format(new Date(iso), 'MMM d, yyyy, h:mm a');
}

/** "3d ago" — activity/relative cells. */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  return `${formatDistanceToNowStrict(new Date(iso))} ago`;
}
