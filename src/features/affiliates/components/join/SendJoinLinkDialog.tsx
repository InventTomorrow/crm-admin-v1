import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useInviteAffiliate } from '../../affiliates.hooks';
import type { Affiliate, AffiliateInviteResult, AffiliateJoinMethod } from '../../types';
import { InviteLinkPanel } from './InviteLinkPanel';
import { JoinMethodFields } from './JoinMethodFields';

interface SendJoinLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliate: Affiliate;
}

export function SendJoinLinkDialog({ open, onOpenChange, affiliate }: SendJoinLinkDialogProps) {
  const [method, setMethod] = useState<AffiliateJoinMethod>(
    affiliate.inviteMethod ?? 'SET_PASSWORD'
  );
  const [sendEmail, setSendEmail] = useState(true);
  const [issuedInvite, setIssuedInvite] = useState<AffiliateInviteResult | null>(null);
  const inviteMutation = useInviteAffiliate(affiliate.id);

  const close = () => {
    setIssuedInvite(null);
    onOpenChange(false);
  };

  const sendLink = () =>
    inviteMutation.mutate(
      { method, sendEmail },
      { onSuccess: invite => (invite.outcome === 'INVITED' ? setIssuedInvite(invite) : close()) }
    );

  return (
    <Modal
      open={open}
      onOpenChange={isOpen => (isOpen ? onOpenChange(true) : close())}
      title="Send a join link"
    >
      {issuedInvite?.outcome === 'INVITED' ? (
        <InviteLinkPanel invite={issuedInvite} onDone={close} />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-default-500">
            {affiliate.name} opens the link to set up their affiliate account on {affiliate.email}.
            {affiliate.inviteExpiresAt ? ' Any earlier link stops working.' : ''}
          </p>
          <JoinMethodFields
            method={method}
            onMethodChange={setMethod}
            sendEmail={sendEmail}
            onSendEmailChange={setSendEmail}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={sendLink}
              loading={inviteMutation.isPending}
              disabled={inviteMutation.isPending}
            >
              {sendEmail ? 'Send link' : 'Create link'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
