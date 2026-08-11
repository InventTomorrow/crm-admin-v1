import { useState } from 'react';
import { Link } from 'react-router';
import type { IconType } from 'react-icons/lib';
import { LuBuilding2, LuCheckCheck, LuCircleAlert, LuInbox, LuUserPlus } from 'react-icons/lu';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { formatDateTime, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AdminNotificationType } from '../notifications.api';
import { useNotifications, useNotificationsSeen } from '../notifications.hooks';
import { Button } from '@/components/ui/button';

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

const TYPE_LABEL: Record<AdminNotificationType, string> = {
  SUBSCRIPTION_REQUEST: 'Subscription requests',
  TENANT_CREATED: 'New tenants',
  USER_REGISTERED: 'New users',
  SUBSCRIPTION_PAST_DUE: 'Past-due subscriptions',
};

export function NotificationsView() {
  const [typeFilter, setTypeFilter] = useState<AdminNotificationType | 'ALL'>('ALL');
  const { data: notifications = [], isLoading, isError, error, refetch } = useNotifications(50);
  const { isUnread, markAllSeen } = useNotificationsSeen();

  const visibleNotifications =
    typeFilter === 'ALL'
      ? notifications
      : notifications.filter(notification => notification.type === typeFilter);
  const unreadCount = notifications.filter(notification => isUnread(notification.createdAt)).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Recent platform activity from the last two weeks"
        action={
          unreadCount > 0 ? (
            <Button size="sm" onClick={markAllSeen}>
              <LuCheckCheck className="size-4 me-1" /> Mark all read ({unreadCount})
            </Button>
          ) : undefined
        }
      />

      <div className="card">
        <div className="card-header flex flex-wrap items-center justify-between gap-3">
          <h6 className="card-title">Activity feed</h6>
          <Select
            value={typeFilter}
            onChange={event => setTypeFilter(event.target.value as AdminNotificationType | 'ALL')}
            className="form-input-sm w-52"
            aria-label="Filter by type"
          >
            <option value="ALL">All types</option>
            {(Object.keys(TYPE_LABEL) as AdminNotificationType[]).map(notificationType => (
              <option key={notificationType} value={notificationType}>
                {TYPE_LABEL[notificationType]}
              </option>
            ))}
          </Select>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : visibleNotifications.length === 0 ? (
          <EmptyState message="No notifications for this filter." />
        ) : (
          <ul className="divide-y divide-default-200">
            {visibleNotifications.map(notification => {
              const Icon = TYPE_ICON[notification.type];
              const unread = isUnread(notification.createdAt);
              return (
                <li key={notification.id}>
                  <Link
                    to={notification.href}
                    className={cn(
                      'flex items-start gap-4 px-5 py-4 hover:bg-default-50',
                      unread && 'bg-primary/5'
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-md',
                        TYPE_ICON_CLASS[notification.type]
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-default-800">
                          {notification.title}
                        </span>
                        {unread && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-default-500">
                        {notification.body}
                      </span>
                    </span>
                    <span className="shrink-0 text-end">
                      <span className="block text-xs font-medium text-default-600">
                        {formatRelative(notification.createdAt)}
                      </span>
                      <span className="mt-0.5 block text-xs text-default-400">
                        {formatDateTime(notification.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
