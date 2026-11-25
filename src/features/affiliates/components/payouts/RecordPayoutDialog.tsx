import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from '@/features/subscriptions/subscriptions.api';
import { formatMoneyPKR } from '@/lib/format';
import { useCreateAffiliatePayout } from '../../affiliates.hooks';

const payoutFormSchema = z.object({
  method: z.enum(PAYMENT_METHODS),
  reference: z.string().trim().max(120),
  notes: z.string().trim().max(500),
});
type PayoutFormValues = z.infer<typeof payoutFormSchema>;

interface RecordPayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliateId: string;
  affiliateName: string;
  amountOwed: number;
}

/** Settles every unpaid commission at once; the server computes the amount. */
export function RecordPayoutDialog({
  open,
  onOpenChange,
  affiliateId,
  affiliateName,
  amountOwed,
}: RecordPayoutDialogProps) {
  const payoutMutation = useCreateAffiliatePayout(affiliateId);
  const form = useForm<PayoutFormValues>({
    resolver: zodResolver(payoutFormSchema),
    defaultValues: { method: 'BANK_TRANSFER', reference: '', notes: '' },
  });

  const onSubmit = (values: PayoutFormValues) =>
    payoutMutation.mutate(
      {
        method: values.method,
        ...(values.reference ? { reference: values.reference } : {}),
        ...(values.notes ? { notes: values.notes } : {}),
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      }
    );

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Mark commission as paid" size="sm">
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="rounded-lg bg-primary/10 p-4 text-center">
          <p className="text-sm text-default-600">Paying {affiliateName}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-primary">
            {formatMoneyPKR(amountOwed)}
          </p>
          <p className="mt-1 text-xs text-default-500">All unpaid commission up to now</p>
        </div>
        <Field label="Paid via">
          <Select {...form.register('method')}>
            {PAYMENT_METHODS.map(paymentMethod => (
              <option key={paymentMethod} value={paymentMethod}>
                {PAYMENT_METHOD_LABELS[paymentMethod]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Transaction reference">
          <Input placeholder="Optional" {...form.register('reference')} />
        </Field>
        <Field label="Notes">
          <Input placeholder="Optional" {...form.register('notes')} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="success"
            loading={payoutMutation.isPending}
            disabled={payoutMutation.isPending}
          >
            Confirm payout
          </Button>
        </div>
      </form>
    </Modal>
  );
}
