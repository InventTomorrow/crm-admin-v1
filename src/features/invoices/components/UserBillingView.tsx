import { useState } from 'react';
import { LuArrowLeft, LuCircleAlert, LuFilePlus, LuHourglass, LuWallet } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router';
import { KpiCard } from '@/components/KpiCard';
import { ErrorState, TenantDetailSkeleton } from '@/components/states';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/features/auth/auth.hooks';
import { SubscriptionSummaryCard } from '@/features/subscriptions/components/SubscriptionSummaryCard';
import { UserAvatar } from '@/features/users/components/UserAvatar';
import { formatFullName } from '@/lib/format';
import { SystemPermissions } from '@/lib/permissions';
import { formatPlanPrice } from '@/lib/planFormat';
import { useBillingSummary } from '../invoices.hooks';
import { AccountBillingDialogs, type BillingDialogRequest } from './AccountBillingDialogs';
import { InvoicesTable } from './InvoicesTable';
import { PendingPaymentsList } from './PendingPaymentsList';

/** One account's billing: its plan, payments awaiting approval and every invoice. */
export function UserBillingView() {
  const { id: ownerUserId = '' } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [billingRequest, setBillingRequest] = useState<BillingDialogRequest | null>(null);
  const summaryQuery = useBillingSummary(ownerUserId);

  if (summaryQuery.isLoading) return <TenantDetailSkeleton />;
  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <div className="card">
        <ErrorState error={summaryQuery.error} onRetry={summaryQuery.refetch} />
      </div>
    );
  }

  const { account, paid, unpaid, pendingPayments } = summaryQuery.data;
  const fullName = formatFullName(account.firstName, account.lastName);
  const displayName = fullName === 'N/A' ? account.email : fullName;
  const pendingAmount = pendingPayments.reduce(
    (sum, pendingPayment) => sum + pendingPayment.amount,
    0
  );
  const canBill = can(SystemPermissions.SUBSCRIPTIONS_CREATE);
  const hasOpenInvoices = unpaid.count > 0;
  const openCreateInvoice = () => setBillingRequest({ kind: 'invoice' });
  const openMakePayment = () => setBillingRequest({ kind: 'payment' });

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="card-body">
          <Button
            variant="ghost"
            size="sm"
            className="-ms-2 mb-3"
            onClick={() => navigate('/users')}
          >
            <LuArrowLeft className="size-4 me-1 rtl:rotate-180" /> Users
          </Button>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <UserAvatar
                firstName={account.firstName}
                lastName={account.lastName}
                email={account.email}
                avatarUrl={account.avatarUrl}
                className="size-14"
              />
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold text-default-900">{displayName}</h1>
                <p className="truncate text-sm text-default-500">
                  {[account.email, account.phone, account.businessName].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            {canBill && (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={openCreateInvoice}>
                  <LuFilePlus className="size-4 me-1.5" /> Create invoice
                </Button>
                <Button
                  onClick={openMakePayment}
                  disabled={!hasOpenInvoices}
                  title={
                    hasOpenInvoices ? undefined : 'No unpaid invoices. Create an invoice first.'
                  }
                >
                  <LuWallet className="size-4 me-1.5" /> Make payment
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <KpiCard
          label="Total paid"
          value={formatPlanPrice(paid.amount, 'PKR')}
          icon={LuWallet}
          variant="brand"
          sub={`${paid.count} paid invoice${paid.count === 1 ? '' : 's'}`}
        />
        <KpiCard
          label="Unpaid"
          value={formatPlanPrice(unpaid.amount, 'PKR')}
          icon={LuCircleAlert}
          sub={`${unpaid.count} open invoice${unpaid.count === 1 ? '' : 's'}`}
        />
        <KpiCard
          label="Pending approval"
          value={formatPlanPrice(pendingAmount, 'PKR')}
          icon={LuHourglass}
          sub={`${pendingPayments.length} payment${pendingPayments.length === 1 ? '' : 's'} to review`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-1">
          <SubscriptionSummaryCard
            ownerUserId={account.id}
            onCreateInvoice={canBill ? openCreateInvoice : undefined}
            onMakePayment={canBill ? openMakePayment : undefined}
            openInvoiceCount={unpaid.count}
          />
          {pendingPayments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-default-900">Payments awaiting approval</p>
              <PendingPaymentsList pendingPayments={pendingPayments} accountEmail={account.email} />
            </div>
          )}
        </div>
        <div className="lg:col-span-2">
          <InvoicesTable
            ownerUserId={account.id}
            onRecordPayment={
              canBill
                ? invoice => setBillingRequest({ kind: 'payment', invoiceId: invoice.id })
                : undefined
            }
          />
        </div>
      </div>

      {canBill && (
        <AccountBillingDialogs
          account={{ id: account.id, label: displayName, sub: account.email }}
          request={billingRequest}
          onRequestChange={setBillingRequest}
        />
      )}
    </div>
  );
}
