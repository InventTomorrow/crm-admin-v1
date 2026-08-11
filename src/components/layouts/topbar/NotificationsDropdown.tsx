import { Link } from 'react-router';
import type { IconType } from 'react-icons/lib';
import {
  LuBellOff,
  LuBellRing,
  LuBuilding2,
  LuCircleAlert,
  LuInbox,
  LuUserPlus,
} from 'react-icons/lu';
import SimpleBar from 'simplebar-react';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AdminNotificationType } from '@/features/notifications/notifications.api';
import {
  useNotifications,
  useNotificationsSeen,
} from '@/features/notifications/notifications.hooks';

const TYPE_ICON: Record<AdminNotificationType, IconType> = {
  SUBSCRIPTION_REQUEST: LuInbox,
  TENANT_CREATED: LuBuilding2,
  USER_REGISTERED: LuUserPlus,
  SUBSCRIPTION_PAST_DUE: LuCircleAlert,
};

const TYPE_ICON_CLASS: Record<AdminNotificationType, string> = {
  SUBSCRIPTION_REQUEST: 'bg-primary/10 text-primary',
  TENANT_CREATED: 'bg-info/10 text-info',
  USER_REGISTERED: 'bg-success/10 text-success',
  SUBSCRIPTION_PAST_DUE: 'bg-warning/15 text-warning',
};

/**
 * Notifications bell (Preline dropdown — static chrome). Feed derives from
 * recent platform activity via GET /admin/notifications; read-state is local.
 */
const NotificationsDropdown = () => {
  const { data: notifications = [], isLoading } = useNotifications();
  const { isUnread, markAllSeen } = useNotificationsSeen();

  const unreadCount = notifications.filter(item => isUnread(item.createdAt)).length;

  return (
    <div className="topbar-item hs-dropdown [--auto-close:inside] relative inline-flex">
      <button
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className="hs-dropdown-toggle btn btn-icon size-8 hover:bg-default-150 rounded-full relative"
      >
        <LuBellRing className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div className="hs-dropdown-menu w-100 max-w-[calc(100vw-1rem)] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-default-200 p-4">
          <h3 className="text-base text-default-800">Notifications</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={markAllSeen}
            >
              Mark all read
            </button>
          )}
        </div>

        <SimpleBar className="max-h-80">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, skeletonIndex) => (
                <div key={skeletonIndex} className="flex animate-pulse gap-3">
                  <div className="size-10 rounded-md bg-default-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-3/4 rounded bg-default-200" />
                    <div className="h-3 w-1/2 rounded bg-default-150" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <LuBellOff className="size-6 text-default-400" />
              <p className="text-sm text-default-500">No notifications yet.</p>
            </div>
          ) : (
            notifications.map(notification => {
              const Icon = TYPE_ICON[notification.type];
              return (
                <Link
                  key={notification.id}
                  to={notification.href}
                  className="flex items-start gap-3 p-4 hover:bg-default-150"
                >
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-md',
                      TYPE_ICON_CLASS[notification.type]
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="flex w-full items-start justify-between gap-2 text-sm">
                    <span className="min-w-0">
                      <span className="mb-1 block font-medium text-default-800">
                        {notification.title}
                      </span>
                      <span className="block truncate text-xs text-default-500">
                        {notification.body}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-default-500">
                      {isUnread(notification.createdAt) && (
                        <span className="size-1.5 rounded-full bg-primary" />
                      )}
                      {formatRelative(notification.createdAt)}
                    </span>
                  </span>
                </Link>
              );
            })
          )}
        </SimpleBar>

        <div className="border-t border-default-200 p-2">
          <Link
            to="/notifications"
            className="block rounded px-3 py-1.5 text-center text-sm font-medium text-primary hover:bg-primary/10"
          >
            View all notifications
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotificationsDropdown;
