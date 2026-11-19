import { useState } from 'react';
import { LuEllipsisVertical, LuFileX, LuWallet } from 'react-icons/lu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { usePermissions } from '@/features/auth/auth.hooks';
import { SystemPermissions } from '@/lib/permissions';
import { formatPlanPrice } from '@/lib/planFormat';
import type { InvoiceListItem } from '@/lib/types';
import { useVoidInvoice } from '../invoices.hooks';
import { DownloadInvoiceButton } from './DownloadInvoiceButton';

interface InvoiceRowActionsProps {
  invoice: InvoiceListItem;
  /** Omitted when the viewer cannot take payments for this account. */
  onRecordPayment?: (invoice: InvoiceListItem) => void;
}

export function InvoiceRowActions({ invoice, onRecordPayment }: InvoiceRowActionsProps) {
  const { can } = usePermissions();
  const voidMutation = useVoidInvoice();
  const [isConfirmingVoid, setIsConfirmingVoid] = useState(false);

  const isOpen = invoice.status === 'OPEN';
  const hasVoidPermission = can(SystemPermissions.SUBSCRIPTIONS_EDIT);
  const canVoid = isOpen && hasVoidPermission;
  const canPay = isOpen && Boolean(onRecordPayment);

  return (
    <div className="flex items-center justify-end gap-1">
      <DownloadInvoiceButton invoice={invoice} />
      {(canPay || canVoid) && (
        <Dropdown
          trigger={<LuEllipsisVertical className="size-4" />}
          triggerLabel={`Actions for invoice ${invoice.number}`}
        >
          {canPay && (
            <DropdownItem icon={LuWallet} onSelect={() => onRecordPayment?.(invoice)}>
              Make payment
            </DropdownItem>
          )}
          {canVoid && (
            <DropdownItem icon={LuFileX} destructive onSelect={() => setIsConfirmingVoid(true)}>
              Cancel invoice
            </DropdownItem>
          )}
        </Dropdown>
      )}

      {/* Gated on permission, not status, so the optimistic Cancelled flip doesn't yank the dialog mid-request. */}
      {hasVoidPermission && (
        <ConfirmDialog
          open={isConfirmingVoid}
          onOpenChange={setIsConfirmingVoid}
          title={`Cancel invoice ${invoice.number}?`}
          description={`The ${formatPlanPrice(invoice.amount, invoice.currency)} charge is cancelled and can no longer be paid. The invoice stays on record as Cancelled. This cannot be undone.`}
          confirmLabel="Cancel invoice"
          cancelLabel="Keep invoice"
          icon={LuFileX}
          isLoading={voidMutation.isPending}
          onConfirm={() =>
            voidMutation.mutate(invoice, { onSuccess: () => setIsConfirmingVoid(false) })
          }
        />
      )}
    </div>
  );
}
