import type { SearchSelectOption } from '@/components/ui/search-select';
import { CreateInvoiceDialog } from './CreateInvoiceDialog';
import { MakePaymentDialog } from './MakePaymentDialog';

export type BillingDialogRequest =
  | { kind: 'invoice'; account?: SearchSelectOption }
  | { kind: 'payment'; invoiceId?: string };

interface AccountBillingDialogsProps {
  /** Null lets each dialog pick the account itself. */
  account: SearchSelectOption | null;
  request: BillingDialogRequest | null;
  onRequestChange: (request: BillingDialogRequest | null) => void;
}

/** Create invoice and Make payment, wired so an account with nothing to pay can jump straight to invoicing. */
export function AccountBillingDialogs({
  account,
  request,
  onRequestChange,
}: AccountBillingDialogsProps) {
  const closeOnDismiss = (isOpen: boolean) => {
    if (!isOpen) onRequestChange(null);
  };

  return (
    <>
      <CreateInvoiceDialog
        open={request?.kind === 'invoice'}
        onOpenChange={closeOnDismiss}
        account={request?.kind === 'invoice' ? (request.account ?? account) : account}
      />
      <MakePaymentDialog
        open={request?.kind === 'payment'}
        onOpenChange={closeOnDismiss}
        account={account}
        invoiceId={request?.kind === 'payment' ? request.invoiceId : undefined}
        onCreateInvoice={pickedAccount =>
          onRequestChange({ kind: 'invoice', account: pickedAccount })
        }
      />
    </>
  );
}
