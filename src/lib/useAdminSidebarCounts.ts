import { useQuery } from '@tanstack/react-query';
import { listSubscriptionRequests } from '@/features/subscription-requests/requests.api';
import { listCheckoutLinks } from '@/features/checkout-links/links.api';
import { countNotifications } from '@/features/notifications/notifications.api';

/** Requests still awaiting an admin decision. */
function usePendingRequestsCount() {
  return useQuery({
    queryKey: ['subscription-requests', 'count', 'PENDING_APPROVAL'],
    // limit: 1 — only meta.total from the page is used.
    queryFn: () => listSubscriptionRequests({ page: 1, limit: 1, status: 'PENDING_APPROVAL' }),
    select: page => page.meta.total,
    refetchInterval: 60_000,
  });
}

/** Checkout links issued but not yet used, revoked, or expired. */
function useActiveCheckoutLinksCount() {
  return useQuery({
    queryKey: ['checkout-links', 'count', 'ACTIVE'],
    queryFn: () => listCheckoutLinks({ page: 1, limit: 1, status: 'ACTIVE' }),
    select: page => page.meta.total,
    refetchInterval: 60_000,
  });
}

/** Noteworthy platform events surfaced in the admin notifications feed. */
function useNotificationsCount() {
  return useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: countNotifications,
    refetchInterval: 60_000,
  });
}

/** Badge counts shown next to sidebar nav items, keyed by menu item key. */
export function useAdminSidebarCounts(): Record<string, number | undefined> {
  const { data: pendingRequests } = usePendingRequestsCount();
  const { data: activeCheckoutLinks } = useActiveCheckoutLinksCount();
  const { data: notifications } = useNotificationsCount();

  return {
    requests: pendingRequests,
    'checkout-links': activeCheckoutLinks,
    notifications,
  };
}
