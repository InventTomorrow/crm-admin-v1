import { useState } from 'react';
import { LuFilePlus, LuWallet } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { AccountBillingDialogs, type BillingDialogRequest } from './AccountBillingDialogs';

/** Page header triggers; each dialog asks for the account first. */
export function BillingHeaderActions() {
  const [billingRequest, setBillingRequest] = useState<BillingDialogRequest | null>(null);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setBillingRequest({ kind: 'invoice' })}>
        <LuFilePlus className="size-4 me-1" /> Create invoice
      </Button>
      <Button size="sm" onClick={() => setBillingRequest({ kind: 'payment' })}>
        <LuWallet className="size-4 me-1" /> Make payment
      </Button>
      <AccountBillingDialogs
        account={null}
        request={billingRequest}
        onRequestChange={setBillingRequest}
      />
    </>
  );
}
