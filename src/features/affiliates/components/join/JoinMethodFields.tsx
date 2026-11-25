import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { ToggleRow } from '@/components/ui/switch';
import { JOIN_METHOD_LABEL } from '../../affiliate-display';
import type { AffiliateJoinMethod } from '../../types';

interface JoinMethodFieldsProps {
  method: AffiliateJoinMethod;
  onMethodChange: (method: AffiliateJoinMethod) => void;
  sendEmail: boolean;
  onSendEmailChange: (sendEmail: boolean) => void;
}

export function JoinMethodFields({
  method,
  onMethodChange,
  sendEmail,
  onSendEmailChange,
}: JoinMethodFieldsProps) {
  return (
    <>
      <Field label="Join link" hint="Their account needs no workspace. They can add one later.">
        <Select
          value={method}
          onChange={event => onMethodChange(event.target.value as AffiliateJoinMethod)}
        >
          {(Object.keys(JOIN_METHOD_LABEL) as AffiliateJoinMethod[]).map(joinMethod => (
            <option key={joinMethod} value={joinMethod}>
              {JOIN_METHOD_LABEL[joinMethod]}
            </option>
          ))}
        </Select>
      </Field>
      <ToggleRow
        label="Email the link to them"
        description="Turn off to only copy the link, for example to send it on WhatsApp."
        checked={sendEmail}
        onChange={event => onSendEmailChange(event.target.checked)}
      />
    </>
  );
}
