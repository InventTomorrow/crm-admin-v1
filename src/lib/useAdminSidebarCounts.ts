import { useQuery } from '@tanstack/react-query';
import { listSubscriptionRequests } from '@/features/subscription-requests/requests.api';
import { listCheckoutLinks } from '@/features/checkout-links/links.api';
import {
  useNotifications,
  useNotificationsSeen,
} from '@/features/notifications/notifications.hooks';
import { useSectionSeenAt } from '@/lib/useSectionSeenAt';

/** Payments still awaiting approval that arrived since the admin last opened User payments. */
function useUnreadPendingPaymentsCount() {
  const { seenAtIso } = useSectionSeenAt('user-payments');
  return useQuery({
    queryKey: ['subscription-requests', 'unread-count', seenAtIso],
    // limit: 1, since only meta.total from the page is used.
    queryFn: () =>
      listSubscriptionRequests({
        page: 1,
        limit: 1,
        status: 'PENDING_APPROVAL',
        createdAfter: seenAtIso,
      }),
    select: page => page.meta.total,
    refetchInterval: 60_000,
  });
}

/** Checkout links created since the admin last opened Checkout links. */
function useUnreadCheckoutLinksCount() {
  const { seenAtIso } = useSectionSeenAt('checkout-links');
  return useQuery({
    queryKey: ['checkout-links', 'unread-count', seenAtIso],
    queryFn: () => listCheckoutLinks({ page: 1, limit: 1, createdAfter: seenAtIso }),
    select: page => page.meta.total,
    refetchInterval: 60_000,
  });
}

/** Same feed and read state as the topbar bell, so the two numbers always agree. */
function useUnreadNotificationsCount() {
  const { data: notifications } = useNotifications();
  const { isUnread } = useNotificationsSeen();
  return notifications?.filter(notification => isUnread(notification.createdAt)).length;
}

/** Unread badge counts shown next to sidebar nav items, keyed by menu item key. */
export function useAdminSidebarCounts(): Record<string, number | undefined> {
  const { data: unreadPendingPayments } = useUnreadPendingPaymentsCount();
  const { data: unreadCheckoutLinks } = useUnreadCheckoutLinksCount();
  const unreadNotifications = useUnreadNotificationsCount();

  return {
    requests: unreadPendingPayments,
    'checkout-links': unreadCheckoutLinks,
    notifications: unreadNotifications,
  };
}
