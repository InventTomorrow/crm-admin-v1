import { useState } from 'react';
import { LuCalendarClock, LuCopy, LuLink, LuPencil, LuPlus, LuTicket, LuTrash2 } from 'react-icons/lu';
import { toast } from 'sonner';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Switch } from '@/components/ui/switch';
import { formatDate } from '@/lib/format';
import {
  CODE_AVAILABILITY_LABEL,
  CODE_AVAILABILITY_TONE,
  codeAvailabilityOf,
} from '../affiliate-display';
import { useDeleteReferralCode, useReferralCodes, useUpdateReferralCode } from '../affiliates.hooks';
import type { ReferralCode } from '../types';
import { ReferralCodeFormDialog } from './ReferralCodeFormDialog';

interface ReferralCodesPanelProps {
  affiliateId: string;
  canManage: boolean;
}

const copyToClipboard = async (text: string, successMessage: string) => {
  await navigator.clipboard.writeText(text);
  toast.success(successMessage);
};

function deleteDescriptionFor(referralCode: ReferralCode): string {
  if (referralCode.uses === 0) return 'Nobody has used this code yet, so it will be removed for good.';
  return `${referralCode.uses} account(s) signed up with this code. It will be retired and its history kept. Accounts that have not paid yet lose the discount.`;
}

export function ReferralCodesPanel({ affiliateId, canManage }: ReferralCodesPanelProps) {
  const { data: referralCodes, isLoading, isError, error, refetch } = useReferralCodes(affiliateId);
  const updateCodeMutation = useUpdateReferralCode();
  const deleteCodeMutation = useDeleteReferralCode();
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const [codeBeingEdited, setCodeBeingEdited] = useState<ReferralCode | null>(null);
  const [codePendingDeletion, setCodePendingDeletion] = useState<ReferralCode | null>(null);

  const openCodeDialog = (referralCode: ReferralCode | null) => {
    setCodeBeingEdited(referralCode);
    setIsCodeDialogOpen(true);
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-default-500">
          Customers enter a code during onboarding. The discount applies to their first payment.
        </p>
        {canManage && (
          <Button size="sm" onClick={() => openCodeDialog(null)}>
            <LuPlus className="size-4 me-1" /> New code
          </Button>
        )}
      </div>

      {!referralCodes?.length ? (
        <EmptyState message="No referral codes yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {referralCodes.map(referralCode => {
            const availability = codeAvailabilityOf(referralCode);
            const usagePercent = referralCode.maxRedemptions
              ? Math.min(100, Math.round((referralCode.uses / referralCode.maxRedemptions) * 100))
              : null;
            return (
              <div
                key={referralCode.id}
                className="flex flex-col gap-4 rounded-xl border border-default-200 bg-default-150/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <LuTicket className="size-5" />
                    </span>
                    <div>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 font-mono text-lg font-semibold tracking-wide text-default-900 hover:text-primary"
                        onClick={() => copyToClipboard(referralCode.code, 'Code copied')}
                        title="Copy code"
                      >
                        {referralCode.code}
                        <LuCopy className="size-3.5 text-default-400" />
                      </button>
                      <Badge tone={CODE_AVAILABILITY_TONE[availability]}>
                        {CODE_AVAILABILITY_LABEL[availability]}
                      </Badge>
                    </div>
                  </div>
                  <span className="rounded-lg bg-success/10 px-2.5 py-1 text-sm font-semibold text-success">
                    {referralCode.discountPercent}% off
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-default-500">
                    <span>
                      {referralCode.uses} sign-up{referralCode.uses === 1 ? '' : 's'}
                    </span>
                    <span>
                      {referralCode.maxRedemptions
                        ? `limit ${referralCode.maxRedemptions}`
                        : 'no limit'}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-default-200">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${usagePercent ?? (referralCode.uses > 0 ? 100 : 0)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-default-500">
                  <LuCalendarClock className="size-3.5" />
                  {referralCode.expiresAt
                    ? `Expires ${formatDate(referralCode.expiresAt)}`
                    : 'Never expires'}
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-default-200 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(referralCode.shareUrl, 'Share link copied')}
                  >
                    <LuLink className="size-4 me-1" /> Share link
                  </Button>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={referralCode.isActive}
                        disabled={updateCodeMutation.isPending}
                        onChange={event =>
                          updateCodeMutation.mutate({
                            codeId: referralCode.id,
                            input: { isActive: event.target.checked },
                          })
                        }
                        aria-label={referralCode.isActive ? 'Pause code' : 'Activate code'}
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Edit code"
                        onClick={() => openCodeDialog(referralCode)}
                      >
                        <LuPencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete code"
                        className="hover:text-danger"
                        onClick={() => setCodePendingDeletion(referralCode)}
                      >
                        <LuTrash2 className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ReferralCodeFormDialog
        open={isCodeDialogOpen}
        onOpenChange={setIsCodeDialogOpen}
        affiliateId={affiliateId}
        referralCode={codeBeingEdited}
      />

      <ConfirmDialog
        open={codePendingDeletion !== null}
        onOpenChange={isOpen => !isOpen && setCodePendingDeletion(null)}
        title={`Delete ${codePendingDeletion?.code ?? 'code'}?`}
        description={codePendingDeletion ? deleteDescriptionFor(codePendingDeletion) : undefined}
        confirmLabel="Delete code"
        isLoading={deleteCodeMutation.isPending}
        onConfirm={() => {
          if (!codePendingDeletion) return;
          deleteCodeMutation.mutate(codePendingDeletion.id, {
            onSuccess: () => setCodePendingDeletion(null),
          });
        }}
      />
    </div>
  );
}
