import { useState } from 'react';
import { LuKeyRound, LuLink2, LuMailCheck, LuSend, LuX } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDate } from '@/lib/format';
import { useRevokeAffiliateInvite } from '../../affiliates.hooks';
import type { Affiliate } from '../../types';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { SendJoinLinkDialog } from './SendJoinLinkDialog';

const hasLiveJoinLink = (affiliate: Affiliate) =>
  !!affiliate.inviteExpiresAt && new Date(affiliate.inviteExpiresAt).getTime() > Date.now();

/** Whether the affiliate can sign in yet, and the controls to get them there. */
export function AffiliateJoinStatus({
  affiliate,
  canManage,
}: {
  affiliate: Affiliate;
  canManage: boolean;
}) {
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const revokeMutation = useRevokeAffiliateInvite(affiliate.id);

  if (affiliate.user) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="info" icon={LuLink2}>
          Linked account{affiliate.joinedAt ? ` since ${formatDate(affiliate.joinedAt)}` : ''}
        </Badge>
        {canManage && (
          <Button size="sm" variant="soft" onClick={() => setIsResetOpen(true)}>
            <LuKeyRound className="size-3.5 me-1" /> Reset password
          </Button>
        )}
        <ResetPasswordDialog
          open={isResetOpen}
          onOpenChange={setIsResetOpen}
          affiliate={affiliate}
        />
      </div>
    );
  }

  const isLinkPending = hasLiveJoinLink(affiliate);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isLinkPending ? (
        <Badge tone="warning" icon={LuMailCheck}>
          Join link valid until {formatDate(affiliate.inviteExpiresAt!)}
        </Badge>
      ) : (
        <Badge tone="neutral">No account yet</Badge>
      )}

      {canManage && (
        <>
          <Button size="sm" variant="soft" onClick={() => setIsSendOpen(true)}>
            <LuSend className="size-3.5 me-1" />{' '}
            {isLinkPending ? 'Send a new link' : 'Send join link'}
          </Button>
          {isLinkPending && (
            <Button size="sm" variant="ghost" onClick={() => setIsRevokeOpen(true)}>
              <LuX className="size-3.5 me-1" /> Cancel link
            </Button>
          )}
        </>
      )}

      <SendJoinLinkDialog open={isSendOpen} onOpenChange={setIsSendOpen} affiliate={affiliate} />
      <ConfirmDialog
        open={isRevokeOpen}
        onOpenChange={setIsRevokeOpen}
        intent="warning"
        title="Cancel this join link?"
        description="The link stops working straight away. You can send a new one any time."
        confirmLabel="Cancel link"
        cancelLabel="Keep it"
        isLoading={revokeMutation.isPending}
        onConfirm={() =>
          revokeMutation.mutate(undefined, { onSuccess: () => setIsRevokeOpen(false) })
        }
      />
    </div>
  );
}
