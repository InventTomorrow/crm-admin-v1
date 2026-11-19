import { formatDate } from '@/lib/format';
import { formatPlanPrice } from '@/lib/planFormat';
import type { InvoiceListItem } from '@/lib/types';
import { cn } from '@/lib/utils';

function isOverdue(invoice: InvoiceListItem): boolean {
  return Boolean(invoice.dueAt && new Date(invoice.dueAt).getTime() < Date.now());
}

function InvoiceOption({
  invoice,
  isSelected,
  onSelect,
}: {
  invoice: InvoiceListItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const periodCount = invoice.periodCount ?? 1;
  const listAmount = invoice.listAmount ?? invoice.amount;
  const hasDiscount = listAmount > invoice.amount;
  const isPastDue = isOverdue(invoice);

  return (
    <li>
      <label
        className={cn(
          'flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors',
          isSelected ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-default-50'
        )}
      >
        <input
          type="radio"
          name="invoiceId"
          className="form-radio mt-0.5 shrink-0"
          checked={isSelected}
          onChange={onSelect}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate font-mono text-xs font-semibold text-default-800">
              {invoice.number}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-default-900">
              {formatPlanPrice(invoice.amount, invoice.currency)}
            </span>
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-default-500">
            <span>
              {invoice.planName ?? 'Subscription'}
              {periodCount > 1 ? ` × ${periodCount}` : ''}
            </span>
            {invoice.dueAt && (
              <>
                <span aria-hidden="true">·</span>
                <span className={cn(isPastDue && 'font-medium text-danger')}>
                  {isPastDue ? 'Overdue since' : 'Due'} {formatDate(invoice.dueAt)}
                </span>
              </>
            )}
          </p>
          {hasDiscount && (
            <p className="mt-0.5 truncate text-xs text-default-400">
              <span className="line-through">{formatPlanPrice(listAmount, invoice.currency)}</span>
              {invoice.discountReason ? ` · ${invoice.discountReason}` : ' · discounted'}
            </p>
          )}
        </div>
      </label>
    </li>
  );
}

interface OpenInvoicePickerProps {
  invoices: InvoiceListItem[];
  selectedInvoiceId: string;
  onSelect: (invoiceId: string) => void;
}

/** Radio list of unpaid invoices; each row carries what the admin needs to pick the right one. */
export function OpenInvoicePicker({
  invoices,
  selectedInvoiceId,
  onSelect,
}: OpenInvoicePickerProps) {
  return (
    <ul
      role="radiogroup"
      aria-label="Invoice being paid"
      className="max-h-60 divide-y divide-default-200 overflow-y-auto rounded-lg border border-default-200"
    >
      {invoices.map(invoice => (
        <InvoiceOption
          key={invoice.id}
          invoice={invoice}
          isSelected={invoice.id === selectedInvoiceId}
          onSelect={() => onSelect(invoice.id)}
        />
      ))}
    </ul>
  );
}
