import { useState } from 'react';
import {
  LuArrowLeft,
  LuBuilding,
  LuChevronDown,
  LuChevronUp,
  LuEye,
  LuEyeOff,
  LuPlus,
  LuSquarePen,
  LuTrash2,
} from 'react-icons/lu';
import { Link } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { usePermissions } from '@/features/auth/auth.hooks';
import { SystemPermissions } from '@/lib/permissions';
import {
  useDeletePaymentAccount,
  usePaymentAccounts,
  useReorderPaymentAccounts,
} from '../accounts.hooks';
import { maskAccountNumber } from '../mask';
import { accountDisplayName, PAYMENT_METHOD_LABELS, type PaymentAccount } from '../types';
import { PaymentAccountForm } from './PaymentAccountForm';

export function PaymentAccountsView() {
  const { data: accounts = [], isLoading } = usePaymentAccounts();
  const deleteMutation = useDeletePaymentAccount();
  const reorderMutation = useReorderPaymentAccounts();
  const { can } = usePermissions();
  const canEditSettings = can(SystemPermissions.SETTINGS_EDIT);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [accountBeingEdited, setAccountBeingEdited] = useState<PaymentAccount | null>(null);
  const [accountPendingDeletion, setAccountPendingDeletion] = useState<PaymentAccount | null>(null);

  const openForm = (account: PaymentAccount | null) => {
    setAccountBeingEdited(account);
    setIsFormOpen(true);
  };

  // The list is already in display order, so a move is a swap with the
  // neighbour — the server rewrites sortOrder from the ids it receives.
  const moveAccount = (index: number, offset: -1 | 1) => {
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= accounts.length) return;

    const orderedIds = accounts.map(account => account.id);
    [orderedIds[index], orderedIds[targetIndex]] = [orderedIds[targetIndex], orderedIds[index]];
    reorderMutation.mutate(orderedIds);
  };

  const canReorder = canEditSettings && accounts.length > 1;

  return (
    <>
      <PageHeader
        title="Payment accounts"
        subtitle="Subscriptions"
        description="Bank and wallet details the customer transfers into before uploading their receipt."
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/subscriptions"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <LuArrowLeft className="size-4" />
              Back
            </Link>
            <PermissionGuard permission={SystemPermissions.SETTINGS_EDIT}>
              <Button size="sm" disabled={isFormOpen} onClick={() => openForm(null)}>
                <LuPlus className="size-4" />
                Add account
              </Button>
            </PermissionGuard>
          </div>
        }
      />

      {isFormOpen && (
        // Remounts when switching between accounts, so the form never carries
        // the previous account's values.
        <PaymentAccountForm
          key={accountBeingEdited?.id ?? 'new'}
          account={accountBeingEdited}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {isLoading && <p className="text-sm text-default-500">Loading…</p>}

      {!isLoading && accounts.length === 0 && (
        <div className="card">
          <div className="card-body text-center">
            <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LuBuilding className="size-5" />
            </span>
            <h5 className="mt-3 font-medium text-default-800">No payment accounts yet</h5>
            <p className="mt-1 text-sm text-default-500">
              Until one is added, the checkout page has nowhere to tell customers to send the money.
            </p>
          </div>
        </div>
      )}

      {canReorder && (
        <p className="mb-3 text-xs text-default-500">
          Customers see the accounts in this order — use the arrows to change it.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {accounts.map((account, index) => {
          const displayName = accountDisplayName(account);

          return (
            <div key={account.id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="truncate font-medium text-default-800">{displayName}</h5>
                      <Badge tone={account.isActive ? 'success' : 'neutral'}>
                        {account.isActive ? 'Live on checkout' : 'Hidden'}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-default-400">
                      {PAYMENT_METHOD_LABELS[account.method] ?? account.method}
                    </p>
                  </div>

                  {canEditSettings && (
                    <div className="flex shrink-0 items-center gap-1">
                      {canReorder && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Move ${displayName} up`}
                            disabled={index === 0 || reorderMutation.isPending}
                            onClick={() => moveAccount(index, -1)}
                          >
                            <LuChevronUp className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Move ${displayName} down`}
                            disabled={index === accounts.length - 1 || reorderMutation.isPending}
                            onClick={() => moveAccount(index, 1)}
                          >
                            <LuChevronDown className="size-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${displayName}`}
                        onClick={() => openForm(account)}
                      >
                        <LuSquarePen className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${displayName}`}
                        onClick={() => setAccountPendingDeletion(account)}
                      >
                        <LuTrash2 className="size-4 text-danger" />
                      </Button>
                    </div>
                  )}
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  <DetailRow label="Account title" value={account.accountTitle} />
                  <DetailRow label="Account number" value={account.accountNumber} sensitive />
                  {account.iban && <DetailRow label="IBAN" value={account.iban} sensitive />}
                  {account.branchCode && (
                    <DetailRow label="Branch code" value={account.branchCode} />
                  )}
                </dl>

                {account.instructions && (
                  <p className="mt-3 rounded-lg bg-default-50 p-3 text-xs text-default-500">
                    {account.instructions}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!accountPendingDeletion}
        onOpenChange={open => !open && setAccountPendingDeletion(null)}
        title={`Delete "${accountPendingDeletion ? accountDisplayName(accountPendingDeletion) : ''}"?`}
        description="Customers will no longer see this account on the checkout page. This cannot be undone."
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!accountPendingDeletion) return;
          deleteMutation.mutate(accountPendingDeletion.id, {
            onSuccess: () => setAccountPendingDeletion(null),
          });
        }}
      />
    </>
  );
}

function DetailRow({
  label,
  value,
  sensitive,
}: {
  label: string;
  value: string;
  /** Masked until the admin reveals it. */
  sensitive?: boolean;
}) {
  const [isRevealed, setIsRevealed] = useState(false);
  const shown = sensitive && !isRevealed ? maskAccountNumber(value) : value;

  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-default-500">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1.5 font-medium text-default-800">
        <span className="truncate">{shown}</span>
        {sensitive && (
          <button
            type="button"
            aria-label={`${isRevealed ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
            className="shrink-0 text-default-400 hover:text-default-700"
            onClick={() => setIsRevealed(current => !current)}
          >
            {isRevealed ? <LuEyeOff className="size-3.5" /> : <LuEye className="size-3.5" />}
          </button>
        )}
      </dd>
    </div>
  );
}
