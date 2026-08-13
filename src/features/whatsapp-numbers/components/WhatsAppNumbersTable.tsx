import { useMemo } from 'react';
import { LuMessageCircle } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { TableRowsSkeleton } from '@/components/states';
import { formatDateTime, formatRelative } from '@/lib/format';
import { getLatestConnectionPerNumber } from '@/features/whatsapp-numbers/whatsapp-numbers.utils';
import type { WhatsAppConnectionItem } from '@/lib/types';

/** Connected/disconnected WhatsApp numbers, one row per number+workspace showing
 * its latest connection. Used on both the Tenant and User detail views — the
 * User one also shows a Workspace column. */
export function WhatsAppNumbersTable({
  numbers,
  isLoading,
  showTenantColumn = false,
}: {
  numbers: WhatsAppConnectionItem[] | undefined;
  isLoading: boolean;
  showTenantColumn?: boolean;
}) {
  const latestConnections = useMemo(() => getLatestConnectionPerNumber(numbers ?? []), [numbers]);

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-default-200 bg-card">
        <TableRowsSkeleton rows={3} cols={showTenantColumn ? 5 : 4} />
      </div>
    );
  }

  if (latestConnections.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-default-200 px-4 py-6 text-center text-sm text-default-500">
        No WhatsApp number has ever been connected.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-default-200 bg-card">
      <table className="min-w-full divide-y divide-default-200">
        <thead className="bg-default-150">
          <tr className="text-start text-sm font-normal text-default-700">
            <th className="px-3.5 py-2 text-start">Number</th>
            {showTenantColumn && <th className="px-3.5 py-2 text-start">Workspace</th>}
            <th className="px-3.5 py-2 text-start">Status</th>
            <th className="px-3.5 py-2 text-start">Connected</th>
            <th className="px-3.5 py-2 text-start">Disconnected</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-default-200">
          {latestConnections.map(connection => (
            <tr key={connection.id} className="text-sm text-default-800">
              <td className="px-3.5 py-2.5 font-medium">
                <span className="flex items-center gap-2">
                  <LuMessageCircle className="size-3.5 text-default-400" />+{connection.phoneNumber}
                  {connection.displayName && (
                    <span className="font-normal text-default-500">({connection.displayName})</span>
                  )}
                </span>
              </td>
              {showTenantColumn && (
                <td className="px-3.5 py-2.5 text-default-600">{connection.tenant?.name ?? '—'}</td>
              )}
              <td className="px-3.5 py-2.5">
                {connection.isActive ? (
                  <Badge tone="success">Active</Badge>
                ) : (
                  <Badge tone="neutral">Disconnected</Badge>
                )}
              </td>
              <td className="px-3.5 py-2.5 text-default-500" title={formatDateTime(connection.connectedAt)}>
                {formatRelative(connection.connectedAt)}
              </td>
              <td className="px-3.5 py-2.5 text-default-500">
                {connection.disconnectedAt ? (
                  <span title={formatDateTime(connection.disconnectedAt)}>
                    {formatRelative(connection.disconnectedAt)}
                  </span>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
