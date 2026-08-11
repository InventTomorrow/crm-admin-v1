import { format, formatDistanceToNowStrict } from 'date-fns';

/** "First Last", falling back to "—" when both parts are missing. */
export function formatFullName(firstName: string | null, lastName: string | null): string {
  return [firstName, lastName].filter(Boolean).join(' ') || '—';
}

/** Platform money is PKR — "Rs. 12,500". Used by MRR and payment amounts. */
export function formatMoneyPKR(amount: number): string {
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
