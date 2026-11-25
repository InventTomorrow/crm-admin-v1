import { useEffect, useState, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LuLoaderCircle, LuTag } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { ControlledNumberInput } from '@/components/ui/controlled-number-input';
import { Field } from '@/components/ui/field';
import { usePermissions } from '@/features/auth/auth.hooks';
import { SystemPermissions } from '@/lib/permissions';
import type { LeadPricingRates } from '../lead-pricing.api';
import { useLeadPricingRates, useUpdateLeadPricingRates } from '../lead-pricing.hooks';
import { describeLeadPlanDiscounts } from '../lead-pricing.util';
import { DisclosureSection } from './DisclosureSection';
import { leadPricingRatesSchema, type LeadPricingRatesFormValues } from '../types';

const EMPTY_RATES: LeadPricingRatesFormValues = {
  pricePerLead: 0,
  messagesPerLead: 0,
  baseFee: 0,
  quarterlyDiscountPercent: 0,
  semiAnnualDiscountPercent: 0,
  annualDiscountPercent: 0,
};

const toFormValues = (rates: LeadPricingRates): LeadPricingRatesFormValues => ({
  pricePerLead: rates.pricePerLead,
  messagesPerLead: rates.messagesPerLead,
  baseFee: rates.baseFee,
  quarterlyDiscountPercent: rates.quarterlyDiscountPercent,
  semiAnnualDiscountPercent: rates.semiAnnualDiscountPercent,
  annualDiscountPercent: rates.annualDiscountPercent,
});

function RatesSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h4 className="text-sm font-semibold text-default-900">{title}</h4>
        <p className="mt-1 text-sm text-default-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

/** The saved rates every lead-priced quote uses: plan form suggestions, public calculator and custom requests. */
export function LeadPricingRatesCard() {
  const { can } = usePermissions();
  const canEditRates = can(SystemPermissions.PLANS_EDIT);
  const { data: savedRates, isLoading } = useLeadPricingRates();
  const updateRatesMutation = useUpdateLeadPricingRates();

  const form = useForm<LeadPricingRatesFormValues>({
    resolver: zodResolver(leadPricingRatesSchema),
    defaultValues: EMPTY_RATES,
  });
  const { errors, isDirty } = form.formState;
  const [isDiscountsOpen, setIsDiscountsOpen] = useState(false);
  const discountSummary = describeLeadPlanDiscounts(form.watch());
  const hasDiscountError =
    !!errors.quarterlyDiscountPercent ||
    !!errors.semiAnnualDiscountPercent ||
    !!errors.annualDiscountPercent;

  useEffect(() => {
    if (savedRates) form.reset(toFormValues(savedRates));
  }, [savedRates, form]);

  // A hidden field with an error would block saving with no visible reason.
  useEffect(() => {
    if (hasDiscountError) setIsDiscountsOpen(true);
  }, [hasDiscountError]);

  const currency = savedRates?.currency ?? 'PKR';
  const fieldsDisabled = isLoading || !canEditRates;

  return (
    <section className="card">
      <div className="card-header">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LuTag className="size-4" />
          </span>
          <div>
            <h6 className="card-title">Saved lead rates</h6>
            <p className="mt-1 text-sm text-default-500">
              Used for plan price suggestions, the public calculator and custom plan requests.
            </p>
          </div>
        </div>
      </div>

      <form
        noValidate
        className="card-body space-y-8 p-6"
        onSubmit={form.handleSubmit(values => updateRatesMutation.mutate(values))}
      >
        <RatesSection
          title="Pricing"
          description="What a lead costs and how many messages it includes."
        >
          <div className="grid gap-x-6 gap-y-5 md:grid-cols-3">
            <Field
              label={`Price per lead (${currency})`}
              hint="What one lead costs the customer each month."
              error={errors.pricePerLead?.message}
            >
              <ControlledNumberInput
                control={form.control}
                name="pricePerLead"
                step="any"
                placeholder="e.g. 20"
                invalid={!!errors.pricePerLead}
                disabled={fieldsDisabled}
              />
            </Field>
            <Field
              label="Messages to close a lead"
              hint="Plan messages are leads × this number."
              error={errors.messagesPerLead?.message}
            >
              <ControlledNumberInput
                control={form.control}
                name="messagesPerLead"
                min={1}
                placeholder="e.g. 10"
                invalid={!!errors.messagesPerLead}
                disabled={fieldsDisabled}
              />
            </Field>
            <Field
              label={`Base fee per month (${currency})`}
              hint="Flat monthly charge on top of the leads. Use 0 for none."
              error={errors.baseFee?.message}
            >
              <ControlledNumberInput
                control={form.control}
                name="baseFee"
                step="any"
                placeholder="0"
                invalid={!!errors.baseFee}
                disabled={fieldsDisabled}
              />
            </Field>
          </div>
        </RatesSection>

        <div className="border-t border-default-200" />

        <DisclosureSection
          title="Long-term discounts"
          summary={
            discountSummary ??
            'Not set. Quarterly, 6 month and annual plans are charged full price.'
          }
          isOpen={isDiscountsOpen}
          onToggle={() => setIsDiscountsOpen(isOpen => !isOpen)}
          toggleLabel={discountSummary ? 'Edit discounts' : 'Add discounts'}
        >
          <p className="mb-4 text-sm text-default-500">
            Percent off the full price when a plan is billed for longer. Monthly is always full
            price.
          </p>
          <div className="grid gap-x-6 gap-y-5 md:grid-cols-3">
            <Field label="Quarterly (%)" error={errors.quarterlyDiscountPercent?.message}>
              <ControlledNumberInput
                control={form.control}
                name="quarterlyDiscountPercent"
                placeholder="0"
                invalid={!!errors.quarterlyDiscountPercent}
                disabled={fieldsDisabled}
              />
            </Field>
            <Field label="6 months (%)" error={errors.semiAnnualDiscountPercent?.message}>
              <ControlledNumberInput
                control={form.control}
                name="semiAnnualDiscountPercent"
                placeholder="0"
                invalid={!!errors.semiAnnualDiscountPercent}
                disabled={fieldsDisabled}
              />
            </Field>
            <Field label="Annual (%)" error={errors.annualDiscountPercent?.message}>
              <ControlledNumberInput
                control={form.control}
                name="annualDiscountPercent"
                placeholder="0"
                invalid={!!errors.annualDiscountPercent}
                disabled={fieldsDisabled}
              />
            </Field>
          </div>
        </DisclosureSection>

        {canEditRates && (
          <div className="flex justify-end border-t border-default-200 pt-6">
            <Button type="submit" disabled={!isDirty || updateRatesMutation.isPending}>
              {updateRatesMutation.isPending && (
                <LuLoaderCircle className="size-4 me-1.5 animate-spin" />
              )}
              {updateRatesMutation.isPending ? 'Saving…' : 'Save rates'}
            </Button>
          </div>
        )}
      </form>
    </section>
  );
}
