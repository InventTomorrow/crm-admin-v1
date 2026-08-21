const VISIBLE_PREFIX = 2;
const VISIBLE_SUFFIX = 4;

/**
 * Account and IBAN numbers are readable by anyone glancing at the admin's
 * screen, so the list shows only the ends: "1234234556783468" → "12**********3468".
 * Short values keep nothing but their last two characters.
 */
export function maskAccountNumber(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= VISIBLE_SUFFIX) return '*'.repeat(trimmed.length);

  const suffix = trimmed.slice(-VISIBLE_SUFFIX);
  const prefix = trimmed.length >= 10 ? trimmed.slice(0, VISIBLE_PREFIX) : '';
  return `${prefix}${'*'.repeat(trimmed.length - prefix.length - VISIBLE_SUFFIX)}${suffix}`;
}
