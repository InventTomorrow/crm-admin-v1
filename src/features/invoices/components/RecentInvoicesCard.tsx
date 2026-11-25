import { LuArrowRight, LuFileText, LuReceiptText } from 'react-icons/lu';
import { Link } from 'react-router';
import { formatDate } from '@/lib/format';
import { formatPlanPrice } from '@/lib/planFormat';
import type { InvoiceListItem } from '@/lib/types';
import { useBillingSummary, useInvoices } from '../invoices.hooks';
import { InvoiceRowActions } from './InvoiceRowActions';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { PendingPaymentsList } from './PendingPaymentsList';

const RECENT_INVOICE_LIMIT = 5;

function formatInvoicePeriod(invoice: InvoiceListItem): string | null {
  if (invoice.status === 'OPEN' && invoice.dueAt) return `Due ${formatDate(invoice.dueAt)}`;
  if (!invoice.periodStart && !invoice.periodEnd) return null;
  return `${formatDate(invoice.periodStart)} to ${formatDate(invoice.periodEnd)}`;
}

interface InvoiceRowProps {
  invoice: InvoiceListItem;
  onRecordPayment?: (invoice: InvoiceListItem) => void;
}

function InvoiceRow({ invoice, onRecordPayment }: InvoiceRowProps) {
  const period = formatInvoicePeriod(invoice);
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <LuFileText className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs font-semibold text-default-800">
          {invoice.number}
        </p>
        <p className="truncate text-xs text-default-500">
          {[invoice.planName, period ?? formatDate(invoice.issuedAt), invoice.payment?.methodLabel]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      <span className="text-sm font-semibold tabular-nums text-default-800">
        {formatPlanPrice(invoice.amount, invoice.currency)}
      </span>
      <InvoiceStatusBadge status={invoice.status} />
      <InvoiceRowActions invoice={invoice} onRecordPayment={onRecordPayment} />
    </li>
  );
}

function InvoiceRowsSkeleton() {
  return (
    <ul className="divide-y divide-default-200">
      {Array.from({ length: 3 }, (_, index) => (
        <li key={index} className="flex items-center gap-3 px-3 py-3">
          <div className="size-8 animate-pulse rounded-md bg-default-200" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-36 animate-pulse rounded bg-default-200" />
            <div className="h-2.5 w-52 animate-pulse rounded bg-default-150" />
          </div>
          <div className="h-4 w-16 animate-pulse rounded bg-default-200" />
        </li>
      ))}
    </ul>
  );
}

interface RecentInvoicesCardProps {
  ownerUserId: string;
  accountEmail: string;
  onRecordPayment?: (invoice: InvoiceListItem) => void;
}

export function RecentInvoicesCard({
  ownerUserId,
  accountEmail,
  onRecordPayment,
}: RecentInvoicesCardProps) {
  const invoicesQuery = useInvoices({ ownerUserId, page: 1, limit: RECENT_INVOICE_LIMIT });
  const summaryQuery = useBillingSummary(ownerUserId);
  const invoices = invoicesQuery.data?.items ?? [];
  const totalInvoices = invoicesQuery.data?.meta.total ?? 0;
  const summary = summaryQuery.data;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-default-200 bg-card p-4 dark:bg-default-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-default-900">
            <LuReceiptText className="size-4 text-default-500" />
            Invoices
            {totalInvoices > 0 && (
              <span className="rounded-full bg-default-100 px-2 py-0.5 text-xs font-medium text-default-600">
                {totalInvoices}
              </span>
            )}
          </p>
          {summary && (
            <p className="mt-0.5 text-xs text-default-500">
              {formatPlanPrice(summary.paid.amount, 'PKR')} paid
              {summary.unpaid.count > 0
                ? ` · ${formatPlanPrice(summary.unpaid.amount, 'PKR')} unpaid`
                : ''}
            </p>
          )}
        </div>
        <Link
          to={`/users/${ownerUserId}/billing`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View all
          <LuArrowRight className="size-3.5 rtl:rotate-180" />
        </Link>
      </div>

      {summary && (
        <PendingPaymentsList
          pendingPayments={summary.pendingPayments}
          accountEmail={accountEmail}
        />
      )}

      <div className="overflow-hidden rounded-lg border border-default-200">
        {invoicesQuery.isLoading ? (
          <InvoiceRowsSkeleton />
        ) : invoicesQuery.isError ? (
          <p className="px-3 py-6 text-center text-sm text-default-500">
            Could not load invoices.{' '}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => invoicesQuery.refetch()}
            >
              Retry
            </button>
          </p>
        ) : invoices.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-default-500">
            No invoices yet. Create one to bill this account.
          </p>
        ) : (
          <ul className="divide-y divide-default-200">
            {invoices.map(invoice => (
              <InvoiceRow key={invoice.id} invoice={invoice} onRecordPayment={onRecordPayment} />
            ))}
          </ul>
        )}
      </div>

      {totalInvoices > RECENT_INVOICE_LIMIT && (
        <p className="text-center text-xs text-default-500">
          Showing the latest {RECENT_INVOICE_LIMIT} of {totalInvoices}.{' '}
          <Link
            to={`/users/${ownerUserId}/billing`}
            className="font-medium text-primary hover:underline"
          >
            See every invoice
          </Link>
        </p>
      )}
    </div>
  );
}
