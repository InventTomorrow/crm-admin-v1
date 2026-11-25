import { formatDate } from '@/lib/format';
import type { AffiliateInviteResult } from '../../types';
import { OneTimeLinkPanel } from '../shared/OneTimeLinkPanel';

type IssuedInvite = Extract<AffiliateInviteResult, { outcome: 'INVITED' }>;

export function InviteLinkPanel({ invite, onDone }: { invite: IssuedInvite; onDone: () => void }) {
  return (
    <OneTimeLinkPanel
      label="Share this join link"
      url={invite.url}
      expiryNote={`Single use, expires on ${formatDate(invite.expiresAt)}.`}
      emailSent={invite.emailSent}
      onDone={onDone}
    />
  );
}
