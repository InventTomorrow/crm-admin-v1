import { useState } from 'react';
import { usePermissions } from '@/features/auth/auth.hooks';
import { SubscriptionSummaryCard } from '@/features/subscriptions/components/SubscriptionSummaryCard';
import { type BillableUser, toPaymentAccount } from '@/features/subscriptions/payment-account';
import { SystemPermissions } from '@/lib/permissions';
import { useBillingSummary } from '../invoices.hooks';
import { AccountBillingDialogs, type BillingDialogRequest } from './AccountBillingDialogs';
import { RecentInvoicesCard } from './RecentInvoicesCard';

/** Accordion body on the Users table: the plan on the left, the paper trail on the right. */
export function UserBillingPanel({ user }: { user: BillableUser }) {
  const { can } = usePermissions();
  const [billingRequest, setBillingRequest] = useState<BillingDialogRequest | null>(null);
  const summaryQuery = useBillingSummary(user.id);
  // A closed account cannot sign in, so billing it would only strand the money.
  const canBill = can(SystemPermissions.SUBSCRIPTIONS_CREATE) && !user.deletedAt;

  return (
    // Tinted to match the expanded row's highlight, so the panel reads as part of that row.
    <div className="grid gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 lg:grid-cols-5 dark:bg-primary/10">
      <div className="lg:col-span-2">
        <SubscriptionSummaryCard
          ownerUserId={user.id}
          onCreateInvoice={canBill ? () => setBillingRequest({ kind: 'invoice' }) : undefined}
          onMakePayment={canBill ? () => setBillingRequest({ kind: 'payment' }) : undefined}
          openInvoiceCount={summaryQuery.data?.unpaid.count}
        />
      </div>
      <div className="lg:col-span-3">
        <RecentInvoicesCard
          ownerUserId={user.id}
          accountEmail={user.originalEmail ?? user.email}
          onRecordPayment={
            canBill
              ? invoice => setBillingRequest({ kind: 'payment', invoiceId: invoice.id })
              : undefined
          }
        />
      </div>

      {canBill && (
        <AccountBillingDialogs
          account={toPaymentAccount(user)}
          request={billingRequest}
          onRequestChange={setBillingRequest}
        />
      )}
    </div>
  );
}
