import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { LuTriangleAlert } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatOfferEndDate, previewOfferEndDate } from '../offer-schedule';
import {
  DURATION_DAY_OPTIONS,
  OFFER_FORM_DEFAULTS,
  offerFormSchema,
  toCreateOfferInput,
  type OfferFormValues,
} from '../offer-form.schema';
import { useActivePromoOffer, useCreatePromoOffer } from '../offers.hooks';
import { MAX_DISCOUNT_PERCENT, MIN_DISCOUNT_PERCENT } from '../types';

interface CreateOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Starts a platform-wide campaign: one percentage off every published plan,
 * running for a fixed number of days from the moment it is created.
 */
export function CreateOfferDialog({ open, onOpenChange }: CreateOfferDialogProps) {
  const { data: runningOffer } = useActivePromoOffer();
  const createOffer = useCreatePromoOffer();

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: OFFER_FORM_DEFAULTS,
  });

  const durationDays = useWatch({ control: form.control, name: 'durationDays' });
  const discountPercent = useWatch({ control: form.control, name: 'discountPercent' });

  const endsAt = previewOfferEndDate(durationDays ?? 0);

  const submit = form.handleSubmit(values => {
    createOffer.mutate(toCreateOfferInput(values), {
      onSuccess: () => {
        form.reset(OFFER_FORM_DEFAULTS);
        onOpenChange(false);
      },
    });
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Start an offer"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} loading={createOffer.isPending}>
            Start offer
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {runningOffer && (
          <div className="flex items-start gap-2.5 rounded border border-warning/30 bg-warning/10 p-3 text-sm text-default-700">
            <LuTriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
            <span>
              <strong className="font-semibold">
                {runningOffer.discountPercent}% off
              </strong>{' '}
              is already running. Starting a new offer ends it immediately — only one
              offer is ever live.
            </span>
          </div>
        )}

        <Field label="Title" htmlFor="offer-title" required error={form.formState.errors.title?.message} hint="Shown on the banner and dialog, e.g. “Eid special”.">
          <Input
            id="offer-title"
            placeholder="Eid special"
            invalid={!!form.formState.errors.title}
            {...form.register('title')}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Discount"
            htmlFor="offer-discount"
            required
            error={form.formState.errors.discountPercent?.message}
            hint="Applies to every published paid plan."
          >
            <Controller
              control={form.control}
              name="discountPercent"
              render={({ field }) => (
                <div className="relative">
                  <Input
                    id="offer-discount"
                    type="number"
                    min={MIN_DISCOUNT_PERCENT}
                    max={MAX_DISCOUNT_PERCENT}
                    className="pe-8"
                    invalid={!!form.formState.errors.discountPercent}
                    value={Number.isFinite(field.value) ? field.value : ''}
                    onChange={event => field.onChange(event.target.valueAsNumber)}
                    onBlur={field.onBlur}
                  />
                  <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-default-400">
                    %
                  </span>
                </div>
              )}
            />
          </Field>

          <Field
            label="Runs for"
            htmlFor="offer-duration"
            required
            error={form.formState.errors.durationDays?.message}
            hint="Counted from the moment you start it."
          >
            <Controller
              control={form.control}
              name="durationDays"
              render={({ field }) => (
                <Select
                  id="offer-duration"
                  invalid={!!form.formState.errors.durationDays}
                  value={field.value}
                  onChange={event => field.onChange(Number(event.target.value))}
                  onBlur={field.onBlur}
                >
                  {DURATION_DAY_OPTIONS.map(days => (
                    <option key={days} value={days}>
                      {days} days
                    </option>
                  ))}
                </Select>
              )}
            />
          </Field>
        </div>

        <Field
          label="Message"
          htmlFor="offer-description"
          error={form.formState.errors.description?.message}
          hint="Optional. Replaces the default line in the customer dialog."
        >
          <Textarea
            id="offer-description"
            rows={2}
            placeholder="Upgrade before the timer runs out and keep the discount for your whole first term."
            invalid={!!form.formState.errors.description}
            {...form.register('description')}
          />
        </Field>

        <div className="rounded border border-default-200 bg-default-50 p-3 text-sm text-default-600">
          Customers on a free trial will see{' '}
          <strong className="font-semibold text-default-800">
            {Number.isFinite(discountPercent) ? discountPercent : 0}% off every plan
          </strong>{' '}
          until midnight on{' '}
          <strong className="font-semibold text-default-800">
            {formatOfferEndDate(endsAt)}
          </strong>{' '}
          (Pakistan time).
        </div>
      </form>
    </Modal>
  );
}
