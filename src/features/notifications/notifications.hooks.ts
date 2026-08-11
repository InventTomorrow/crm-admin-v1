import { useQuery } from '@tanstack/react-query';
import { useLocalStorage } from 'usehooks-ts';
import { listNotifications } from './notifications.api';

const SEEN_AT_STORAGE_KEY = 'admin.notificationsSeenAt';

export function useNotifications(limit = 20) {
  return useQuery({
    queryKey: ['notifications', limit],
    queryFn: () => listNotifications(limit),
    refetchInterval: 60_000,
  });
}

/**
 * Read-state is client-side: anything newer than the persisted "seen at"
 * timestamp counts as unread; marking all read just moves the timestamp.
 */
export function useNotificationsSeen() {
  const [seenAtIso, setSeenAtIso] = useLocalStorage<string>(SEEN_AT_STORAGE_KEY, () =>
    new Date(0).toISOString()
  );

  const isUnread = (createdAtIso: string) => createdAtIso > seenAtIso;
  const markAllSeen = () => setSeenAtIso(new Date().toISOString());

  return { isUnread, markAllSeen };
}
