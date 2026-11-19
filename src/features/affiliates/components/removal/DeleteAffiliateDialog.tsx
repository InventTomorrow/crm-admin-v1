import { useState } from 'react';
import { LuCirclePause, LuShieldAlert, LuTrash2 } from 'react-icons/lu';
import { LoadingState } from '@/components/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useDeleteAffiliate, useSetAffiliateStatus } from '../../affiliates.hooks';
import type { AffiliateStatus } from '../../types';
import { ForceDeleteSteps } from './ForceDeleteSteps';

export interface AffiliateRemovalHistory {
  signups: number;
  conversions: number;
  commissionOwed: number;
}

interface DeleteAffiliateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliate: { id: string; name: string; status: AffiliateStatus } | null;
  /** Null while the numbers are still loading. */
  history: AffiliateRemovalHistory | null;
  onRemoved?: () => void;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** Mirrors the server rules: no history deletes, sign-ups only archive, earnings need suspend or a force delete. */
export function DeleteAffiliateDialog({
  open,
  onOpenChange,
  affiliate,
  history,
  onRemoved,
}: DeleteAffiliateDialogProps) {
  const [isForceDeleteOpen, setIsForceDeleteOpen] = useState(false);
  const deleteAffiliateMutation = useDeleteAffiliate();
  const setStatusMutation = useSetAffiliateStatus(affiliate?.id ?? '');

  const closeDialog = () => {
    setIsForceDeleteOpen(false);
    onOpenChange(false);
  };
  const finishRemoval = () => {
    closeDialog();
    onRemoved?.();
  };

  const hasEarnings = (history?.conversions ?? 0) > 0;
  const title = !affiliate
    ? 'Delete affiliate'
    : !hasEarnings
      ? `Delete ${affiliate.name}?`
      : isForceDeleteOpen
        ? `Force delete ${affiliate.name}`
        : `${affiliate.name} can't be deleted`;

  const renderBody = () => {
    if (!affiliate || !history) return <LoadingState />;

    if (!hasEarnings) {
      const isArchive = history.signups > 0;
      return (
        <div className="space-y-5">
          <p className="text-sm text-default-600">
            {isArchive
              ? `They have ${plural(history.signups, 'sign-up')} but no paid customers, so they will be archived: their codes stop working and the sign-ups stay in reports.`
              : 'They have no referral history, so they and their codes will be removed for good.'}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deleteAffiliateMutation.isPending}
              disabled={deleteAffiliateMutation.isPending}
              onClick={() =>
                deleteAffiliateMutation.mutate(affiliate.id, { onSuccess: finishRemoval })
              }
            >
              <LuTrash2 className="size-4 me-1" />{' '}
              {isArchive ? 'Archive affiliate' : 'Delete affiliate'}
            </Button>
          </div>
        </div>
      );
    }

    if (isForceDeleteOpen) {
      return (
        <ForceDeleteSteps
          affiliate={affiliate}
          history={history}
          onBack={() => setIsForceDeleteOpen(false)}
          onDeleted={finishRemoval}
        />
      );
    }

    const isSuspended = affiliate.status === 'PAUSED';
    return (
      <div className="space-y-4">
        <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-default-700">
          <LuShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
          <p>
            They brought in{' '}
            <span className="font-medium">{plural(history.conversions, 'paying customer')}</span>.
            Their referrals, earnings and payouts are financial records, so a normal delete is
            blocked.
          </p>
        </div>

        <div className="rounded-lg border border-default-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-medium text-default-800">Suspend them instead</h4>
            <Badge tone="success">Recommended</Badge>
          </div>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-default-600">
            <li>Their codes stop working for new sign-ups.</li>
            <li>Their referrals, earnings and payouts stay in your reports.</li>
            <li>You can reactivate them any time from Edit.</li>
          </ul>
          <div className="mt-3">
            {isSuspended ? (
              <Badge tone="warning">Already suspended</Badge>
            ) : (
              <Button
                size="sm"
                loading={setStatusMutation.isPending}
                disabled={setStatusMutation.isPending}
                onClick={() => setStatusMutation.mutate('PAUSED', { onSuccess: closeDialog })}
              >
                <LuCirclePause className="size-4 me-1" /> Suspend affiliate
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default-200 pt-4">
          <p className="text-sm text-default-500">
            Still need to remove them for good?{' '}
            <button
              type="button"
              className="font-medium text-danger hover:underline"
              onClick={() => setIsForceDeleteOpen(true)}
            >
              Force delete
            </button>
          </p>
          <Button variant="ghost" onClick={closeDialog}>
            Close
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={isOpen => (isOpen ? onOpenChange(true) : closeDialog())}
      title={title}
      size={hasEarnings ? 'lg' : 'sm'}
    >
      {renderBody()}
    </Modal>
  );
}
