import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
  approveApplicationFormSchema,
  type ApproveApplicationFormValues,
} from '../../affiliate-form.schema';
import { useApproveAffiliateApplication } from '../../affiliates.hooks';
import {
  MAX_COMMISSION_PERCENT,
  type AffiliateApplication,
  type AffiliateInviteResult,
} from '../../types';
import { InviteLinkPanel } from '../join/InviteLinkPanel';
import { JoinMethodFields } from '../join/JoinMethodFields';

const APPROVAL_DEFAULTS: ApproveApplicationFormValues = {
  commissionPercent: 10,
  method: 'SET_PASSWORD',
  sendEmail: true,
};

interface ApproveApplicationDialogProps {
  application: AffiliateApplication | null;
  onClose: () => void;
}

export function ApproveApplicationDialog({ application, onClose }: ApproveApplicationDialogProps) {
  const [issuedInvite, setIssuedInvite] = useState<AffiliateInviteResult | null>(null);
  const approveMutation = useApproveAffiliateApplication();
  const form = useForm<ApproveApplicationFormValues>({
    resolver: zodResolver(approveApplicationFormSchema),
    defaultValues: APPROVAL_DEFAULTS,
  });

  useEffect(() => {
    if (!application) return;
    form.reset(APPROVAL_DEFAULTS);
    setIssuedInvite(null);
  }, [application, form]);

  if (!application) return null;

  const onSubmit = (values: ApproveApplicationFormValues) =>
    approveMutation.mutate(
      { applicationId: application.id, input: values },
      {
        onSuccess: approval =>
          approval.invite?.outcome === 'INVITED' ? setIssuedInvite(approval.invite) : onClose(),
      }
    );

  return (
    <Modal
      open
      onOpenChange={isOpen => !isOpen && onClose()}
      title={issuedInvite ? 'Application approved' : `Approve ${application.name}`}
    >
      {issuedInvite?.outcome === 'INVITED' ? (
        <InviteLinkPanel invite={issuedInvite} onDone={onClose} />
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <p className="text-sm text-default-500">
            This adds {application.name} ({application.email}) as an affiliate and sends them a link
            to set up their account. Create their referral codes from the affiliate page afterwards.
          </p>
          <Controller
            control={form.control}
            name="commissionPercent"
            render={({ field, fieldState }) => (
              <Field
                label="Commission %"
                required
                error={fieldState.error?.message}
                hint="Earned on the first payment of each referred account."
              >
                <Input
                  type="number"
                  min={0}
                  max={MAX_COMMISSION_PERCENT}
                  step={0.5}
                  invalid={!!fieldState.error}
                  value={Number.isNaN(field.value) ? '' : field.value}
                  onChange={event => field.onChange(event.target.valueAsNumber)}
                />
              </Field>
            )}
          />
          <JoinMethodFields
            method={form.watch('method')}
            onMethodChange={method => form.setValue('method', method)}
            sendEmail={form.watch('sendEmail')}
            onSendEmailChange={sendEmail => form.setValue('sendEmail', sendEmail)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={approveMutation.isPending}
              disabled={approveMutation.isPending}
            >
              Approve
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
