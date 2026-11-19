import { useCallback, useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';

export type SeenSection = 'user-payments' | 'checkout-links';

const NEVER_SEEN_ISO = new Date(0).toISOString();

/** When this browser last opened a section; anything created after it counts as unread. */
export function useSectionSeenAt(section: SeenSection) {
  const [seenAtIso, setSeenAtIso] = useLocalStorage<string>(
    `admin.seenAt.${section}`,
    NEVER_SEEN_ISO
  );
  const markSeen = useCallback(() => setSeenAtIso(new Date().toISOString()), [setSeenAtIso]);
  return { seenAtIso, markSeen };
}

/** Marks a section read on arrival and again on leaving, so rows that land mid-visit are covered. */
export function useMarkSectionSeen(section: SeenSection) {
  const { markSeen } = useSectionSeenAt(section);
  useEffect(() => {
    markSeen();
    return markSeen;
  }, [markSeen]);
}
