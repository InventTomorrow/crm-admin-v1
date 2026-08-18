import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { LuHeadset, LuLoaderCircle } from 'react-icons/lu';
import { toast } from 'sonner';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/features/auth/auth.hooks';
import { PermissionGuard } from '@/components/PermissionGuard';
import { SystemPermissions } from '@/lib/permissions';
import { apiMessage } from '@/lib/apiClient';
import { getSupportContact, updateSupportContact, type SupportContact } from './settings.api';
import { supportContactSchema, type SupportContactFormValues } from './types';
import { Button } from '@/components/ui/button';

const toFormValues = (contact: SupportContact): SupportContactFormValues => ({
  supportName: contact.supportName ?? '',
  supportPhone: contact.supportPhone ?? '',
  supportWhatsapp: contact.supportWhatsapp ?? '',
  supportEmail: contact.supportEmail ?? '',
  paymentInstructions: contact.paymentInstructions ?? '',
});

/**
 * Support contact + payment instructions rendered on the public checkout page,
 * so the customer knows how to reach us for approval. `supportEmail` also
 * receives the "new subscription request" notification.
 */
export function SupportContactCard() {
  const qc = useQueryClient();
  const { can } = usePermissions();
  const canEditSettings = can(SystemPermissions.SETTINGS_EDIT);
  const { data, isLoading } = useQuery({
    queryKey: ['support-contact'],
    queryFn: getSupportContact,
  });

  const form = useForm<SupportContactFormValues>({
    resolver: zodResolver(supportContactSchema),
    defaultValues: {
      supportName: '',
      supportPhone: '',
      supportWhatsapp: '',
      supportEmail: '',
      paymentInstructions: '',
    },
  });
  const { errors } = form.formState;

  // Seed once the fetch lands; nulls become empty strings so the inputs stay controlled.
  useEffect(() => {
    if (data) form.reset(toFormValues(data));
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: (values: SupportContactFormValues) =>
      // Send null rather than "" so a cleared field is actually unset.
      updateSupportContact({
        supportName: values.supportName.trim() || null,
        supportPhone: values.supportPhone.trim() || null,
        supportWhatsapp: values.supportWhatsapp.trim() || null,
        supportEmail: values.supportEmail.trim() || null,
        paymentInstructions: values.paymentInstructions.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-contact'] });
      toast.success('Support contact saved');
    },
    onError: error => toast.error(apiMessage(error)),
  });

  const fieldsDisabled = isLoading || !canEditSettings;

  return (
    <div className="card">
      <div className="card-header">
        <h6 className="card-title flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LuHeadset className="size-4" />
          </span>
          Customer support contact
        </h6>
        <p className="mt-1 text-sm text-default-500">
          Shown on the public checkout page. The email also receives new subscription request
          notifications.
        </p>
      </div>
      <form
        onSubmit={form.handleSubmit(values => saveMutation.mutate(values))}
        noValidate
        className="card-body space-y-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Display name">
            <Input
              placeholder="AsaanRabta Billing"
              disabled={fieldsDisabled}
              {...form.register('supportName')}
            />
          </Field>
          <Field label="Email" error={errors.supportEmail?.message}>
            <Input
              type="email"
              placeholder="billing@asaanrabta.com"
              disabled={fieldsDisabled}
              invalid={!!errors.supportEmail}
              {...form.register('supportEmail')}
            />
          </Field>
          <Field label="Phone">
            <Input
              placeholder="+92 300 0000000"
              disabled={fieldsDisabled}
              {...form.register('supportPhone')}
            />
          </Field>
          <Field label="WhatsApp">
            <Input
              placeholder="+92 300 0000000"
              disabled={fieldsDisabled}
              {...form.register('supportWhatsapp')}
            />
          </Field>
        </div>

        <Field
          label="Payment instructions"
          hint="Bank / wallet details the customer pays into before uploading their receipt."
        >
          <Textarea
            rows={4}
            placeholder={'HBL 1234-5678-9012 — AsaanRabta (Pvt) Ltd\nEasypaisa: 0300-0000000'}
            disabled={fieldsDisabled}
            {...form.register('paymentInstructions')}
          />
        </Field>

        <PermissionGuard permission={SystemPermissions.SETTINGS_EDIT}>
          <Button type="submit" disabled={isLoading || saveMutation.isPending}>
            {saveMutation.isPending && <LuLoaderCircle className="size-4 me-1.5 animate-spin" />}
            {saveMutation.isPending ? 'Saving…' : 'Save contact'}
          </Button>
        </PermissionGuard>
      </form>
    </div>
  );
}
