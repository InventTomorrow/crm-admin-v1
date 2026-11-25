import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ToggleRow } from '@/components/ui/switch';
import { formatDateTime } from '@/lib/format';
import { useIssueAffiliatePasswordReset } from '../../affiliates.hooks';
import type { Affiliate, PasswordResetLink } from '../../types';
import { OneTimeLinkPanel } from '../shared/OneTimeLinkPanel';

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliate: Affiliate;
}

export function ResetPasswordDialog({ open, onOpenChange, affiliate }: ResetPasswordDialogProps) {
  const [sendEmail, setSendEmail] = useState(true);
  const [resetLink, setResetLink] = useState<PasswordResetLink | null>(null);
  const resetMutation = useIssueAffiliatePasswordReset(affiliate.id);
  const accountEmail = affiliate.user?.email ?? affiliate.email;

  const close = () => {
    setResetLink(null);
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={isOpen => (isOpen ? onOpenChange(true) : close())}
      title="Reset password"
    >
      {resetLink ? (
        <OneTimeLinkPanel
          label="Share this reset link"
          url={resetLink.url}
          expiryNote={`Single use, works until ${formatDateTime(resetLink.expiresAt)}.`}
          emailSent={resetLink.emailSent}
          onDone={close}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-default-500">
            {affiliate.name} opens the link to choose a new password for {accountEmail}. It works
            once, for 30 minutes. Their current password keeps working until they change it.
          </p>
          <ToggleRow
            label="Email the link to them"
            description="Turn off when email isn't reaching them, then copy the link and send it on WhatsApp."
            checked={sendEmail}
            onChange={event => setSendEmail(event.target.checked)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={() => resetMutation.mutate(sendEmail, { onSuccess: setResetLink })}
              loading={resetMutation.isPending}
              disabled={resetMutation.isPending}
            >
              Create reset link
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
