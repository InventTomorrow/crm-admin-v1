import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { LuLoaderCircle } from 'react-icons/lu';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { ControlledNumberInput } from '@/components/ui/controlled-number-input';
import { Field } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { useUpdateExchangeRate } from '../ai-pricing.hooks';

const exchangeRateFormSchema = z.object({
  usdToPkrRate: z.number().positive('Must be greater than 0'),
});
type ExchangeRateFormValues = z.infer<typeof exchangeRateFormSchema>;

/** Used to show a secondary PKR figure alongside every USD cost, until changed again. */
export function AiExchangeRateDialog({
  open,
  onOpenChange,
  currentRate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRate: number | null;
}) {
  const updateRateMutation = useUpdateExchangeRate();

  const form = useForm<ExchangeRateFormValues>({
    resolver: zodResolver(exchangeRateFormSchema),
    defaultValues: { usdToPkrRate: currentRate ?? 0 },
  });

  useEffect(() => {
    if (open) form.reset({ usdToPkrRate: currentRate ?? 0 });
  }, [open, currentRate, form]);

  const submit = form.handleSubmit(values => {
    updateRateMutation.mutate(values.usdToPkrRate, {
      onSuccess: () => onOpenChange(false),
    });
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="USD → PKR rate"
      footer={
        <Button type="submit" form="exchange-rate-form" disabled={updateRateMutation.isPending}>
          {updateRateMutation.isPending && (
            <LuLoaderCircle className="size-4 me-1.5 animate-spin" />
          )}
          {updateRateMutation.isPending ? 'Saving…' : 'Save rate'}
        </Button>
      }
    >
      <form id="exchange-rate-form" onSubmit={submit} noValidate className="space-y-3">
        <Field
          label="USD → PKR rate"
          hint="Used to show a secondary PKR figure alongside every USD cost, until changed again."
          error={form.formState.errors.usdToPkrRate?.message}
        >
          <ControlledNumberInput
            control={form.control}
            name="usdToPkrRate"
            step="0.01"
            placeholder="0.00"
          />
        </Field>
      </form>
    </Modal>
  );
}
