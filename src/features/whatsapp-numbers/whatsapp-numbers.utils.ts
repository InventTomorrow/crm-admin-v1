import type { WhatsAppConnectionItem } from '@/lib/types';

/**
 * Collapses the append-only history into one row per number+workspace, keeping
 * the most recent connection so a number connected many times shows once with
 * its latest connectivity time.
 */
export function getLatestConnectionPerNumber(
  connections: WhatsAppConnectionItem[]
): WhatsAppConnectionItem[] {
  const latestByNumber = new Map<string, WhatsAppConnectionItem>();

  for (const connection of connections) {
    const numberKey = `${connection.tenantId}::${connection.phoneNumber}`;
    const existing = latestByNumber.get(numberKey);
    if (!existing || Date.parse(connection.connectedAt) > Date.parse(existing.connectedAt)) {
      latestByNumber.set(numberKey, connection);
    }
  }

  return [...latestByNumber.values()].sort(
    (a, b) => Date.parse(b.connectedAt) - Date.parse(a.connectedAt)
  );
}
