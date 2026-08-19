const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Campaigns end on Pakistan midnight — see the server's promo-offer.util.ts.
 * Every date shown here is formatted in that zone, so an admin abroad reads
 * the same deadline a customer does instead of "05:00 on the 27th".
 */
export const OFFER_TIMEZONE = 'Asia/Karachi';

/** "2026-08-26" for the given instant, read in Pakistan time. */
function offerZoneDateKey(instant: Date): string {
  // en-CA gives ISO-ordered parts, so no manual reassembly.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: OFFER_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** "2026-08-26" -> "2026-08-27". Pure string maths, no zone involved. */
function nextDateKey(dateKey: string): string {
  return new Date(new Date(`${dateKey}T00:00:00Z`).getTime() + DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/**
 * The day a campaign started now would end on, matching the server's round-up
 * rule: the first Pakistan midnight after `durationDays` have elapsed.
 *
 * The returned instant is only meaningful once read back in OFFER_TIMEZONE —
 * it identifies the end *day*, not the exact boundary. Preview only; the
 * authoritative endsAt comes back from the create response.
 */
export function previewOfferEndDate(durationDays: number): Date {
  const earliestEnd = new Date(Date.now() + durationDays * DAY_MS);
  return new Date(`${nextDateKey(offerZoneDateKey(earliestEnd))}T00:00:00Z`);
}

/**
 * "Thu, 27 Aug 2026". Deliberately date-only: the time is always midnight, so
 * printing 00:00 next to it reads like a bug rather than a deadline.
 */
export function formatOfferEndDate(endsAt: Date | string): string {
  const instant = typeof endsAt === 'string' ? new Date(endsAt) : endsAt;
  return new Intl.DateTimeFormat(undefined, {
    timeZone: OFFER_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(instant);
}
