import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { LuRotateCcw } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { ControlledNumberInput } from '@/components/ui/controlled-number-input';
import { Field } from '@/components/ui/field';
import { formatPlanPrice } from '@/lib/planFormat';
import { cn } from '@/lib/utils';
import type { LeadPricingRates, LeadPricingRatesInput } from '../lead-pricing.api';
import { useLeadPricingRates } from '../lead-pricing.hooks';
import {
  describeLeadPlanDiscounts,
  getLeadPlanQuote,
  LEAD_PRICED_DURATION_LABEL,
  LEAD_PRICED_DURATIONS,
  type LeadPricedDuration,
} from '../lead-pricing.util';
import { leadPricingCalculatorSchema, type LeadPricingCalculatorFormValues } from '../types';
import { DisclosureSection } from './DisclosureSection';

const DEFAULT_MONTHLY_LEADS = 100;
const RATE_FIELDS = [
  'pricePerLead',
  'messagesPerLead',
  'baseFee',
  'quarterlyDiscountPercent',
  'semiAnnualDiscountPercent',
  'annualDiscountPercent',
] as const satisfies readonly (keyof LeadPricingRatesInput)[];

const ZERO_RATES: LeadPricingRatesInput = {
  pricePerLead: 0,
  messagesPerLead: 0,
  baseFee: 0,
  quarterlyDiscountPercent: 0,
  semiAnnualDiscountPercent: 0,
  annualDiscountPercent: 0,
};

const DISCOUNT_INPUTS = [
  { name: 'quarterlyDiscountPercent', label: 'Quarterly (%)' },
  { name: 'semiAnnualDiscountPercent', label: '6 months (%)' },
  { name: 'annualDiscountPercent', label: 'Annual (%)' },
] as const;

function CalculatorGroup({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5 py-7 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-default-900">{title}</h4>
          <p className="mt-1 text-xs text-default-500">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Rolls the old value up and the new one in, so a changing price is easy to follow. */
function AnimatedValue({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn('relative inline-flex overflow-hidden', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '70%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-70%', opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <span className="text-default-500">{label}</span>
      <AnimatedValue value={value} className="font-medium text-default-800" />
    </div>
  );
}

interface LeadPricingCalculatorProps {
  /** Seeds the calculator from the plan being edited. */
  initialMonthlyLeads?: number;
  initialDuration?: LeadPricedDuration;
}

/** What-if calculator: starts from the saved rates; edits here are never saved. */
export function LeadPricingCalculator({
  initialMonthlyLeads,
  initialDuration,
}: LeadPricingCalculatorProps) {
  const periodLayoutGroupId = useId();
  const { data: savedRates } = useLeadPricingRates();
  const currency = savedRates?.currency ?? 'PKR';

  const form = useForm<LeadPricingCalculatorFormValues>({
    resolver: zodResolver(leadPricingCalculatorSchema),
    mode: 'onChange',
    defaultValues: {
      monthlyLeads: initialMonthlyLeads ?? DEFAULT_MONTHLY_LEADS,
      duration: initialDuration ?? 'MONTHLY',
      ...ZERO_RATES,
      ...(savedRates
        ? Object.fromEntries(RATE_FIELDS.map(rateField => [rateField, savedRates[rateField]]))
        : {}),
    },
  });
  const { errors } = form.formState;

  const applyRates = useCallback(
    (rates: LeadPricingRates) => {
      for (const rateField of RATE_FIELDS) {
        form.setValue(rateField, rates[rateField], { shouldValidate: true });
      }
    },
    [form]
  );

  useEffect(() => {
    if (savedRates) applyRates(savedRates);
  }, [savedRates, applyRates]);

  const watchedValues = form.watch();
  const parsedValues = useMemo(
    () => leadPricingCalculatorSchema.safeParse(watchedValues),
    [watchedValues]
  );
  const calculatorValues = parsedValues.success ? parsedValues.data : null;
  const selectedDuration = watchedValues.duration;
  // Invalid input shows zeros in the same layout instead of collapsing the panel.
  const quote = calculatorValues
    ? getLeadPlanQuote(calculatorValues.monthlyLeads, calculatorValues.duration, calculatorValues)
    : getLeadPlanQuote(0, selectedDuration, ZERO_RATES);

  const isUsingSavedRates =
    !!savedRates &&
    RATE_FIELDS.every(rateField => watchedValues[rateField] === savedRates[rateField]);

  const [isRatesOpen, setIsRatesOpen] = useState(false);
  const hasRateError = RATE_FIELDS.some(rateField => !!errors[rateField]);
  // A hidden field with an error would leave the price blank with no visible reason.
  useEffect(() => {
    if (hasRateError) setIsRatesOpen(true);
  }, [hasRateError]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="divide-y divide-default-200">
          <CalculatorGroup
            title="Plan size"
            description="How many leads the customer expects each month."
          >
            <Field label="Leads per month" error={errors.monthlyLeads?.message}>
              <ControlledNumberInput
                control={form.control}
                name="monthlyLeads"
                min={1}
                placeholder="e.g. 500"
                invalid={!!errors.monthlyLeads}
              />
            </Field>
          </CalculatorGroup>

          <CalculatorGroup
            title="Billing period"
            description="Pick how often the plan is billed. Each card shows its total."
          >
            <LayoutGroup id={periodLayoutGroupId}>
              <div role="radiogroup" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {LEAD_PRICED_DURATIONS.map(duration => {
                  const isSelected = duration === selectedDuration;
                  const periodQuote = calculatorValues
                    ? getLeadPlanQuote(calculatorValues.monthlyLeads, duration, calculatorValues)
                    : getLeadPlanQuote(0, duration, ZERO_RATES);
                  return (
                    <motion.button
                      key={duration}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => form.setValue('duration', duration, { shouldValidate: true })}
                      className={cn(
                        'relative rounded-lg border px-3.5 py-3 text-start transition-colors',
                        isSelected
                          ? 'border-transparent'
                          : 'border-default-200 hover:border-default-300'
                      )}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="selected-billing-period"
                          className="absolute inset-0 rounded-lg border border-primary bg-primary/10"
                          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                        />
                      )}
                      <span className="relative flex items-center justify-between gap-2 text-xs text-default-500">
                        {LEAD_PRICED_DURATION_LABEL[duration]}
                        {periodQuote.discountPercent > 0 && (
                          <span className="rounded-full bg-success/10 px-1.5 py-0.5 text-[11px] font-medium text-success">
                            Save {periodQuote.discountPercent}%
                          </span>
                        )}
                      </span>
                      <AnimatedValue
                        value={formatPlanPrice(periodQuote.totalPrice, currency)}
                        className="relative mt-1 text-sm font-semibold text-default-900"
                      />
                    </motion.button>
                  );
                })}
              </div>
            </LayoutGroup>
          </CalculatorGroup>

          <section className="py-7 first:pt-0 last:pb-0">
            <DisclosureSection
              title="Rates"
              summary={
                <>
                  {formatPlanPrice(watchedValues.pricePerLead, currency)} per lead,{' '}
                  {watchedValues.messagesPerLead} messages per lead
                  {watchedValues.baseFee > 0 &&
                    `, ${formatPlanPrice(watchedValues.baseFee, currency)} base fee`}
                  . Discounts: {describeLeadPlanDiscounts(watchedValues) ?? 'none'}.
                  {!isUsingSavedRates && savedRates && (
                    <span className="ms-1 font-medium text-warning">Test values.</span>
                  )}
                </>
              }
              isOpen={isRatesOpen}
              onToggle={() => setIsRatesOpen(isOpen => !isOpen)}
              toggleLabel="Adjust"
              action={
                !isUsingSavedRates &&
                savedRates && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => applyRates(savedRates)}
                  >
                    <LuRotateCcw className="size-3.5 me-1" /> Use saved rates
                  </Button>
                )
              }
            >
              <div className="space-y-6 rounded-xl border border-default-200 p-5">
                <p className="text-xs text-default-500">
                  Starts from the saved rates. Changes here are only for testing and are never
                  saved.
                </p>
                <div className="grid gap-x-5 gap-y-5 sm:grid-cols-3">
                  <Field
                    label={`Price per lead (${currency})`}
                    error={errors.pricePerLead?.message}
                  >
                    <ControlledNumberInput
                      control={form.control}
                      name="pricePerLead"
                      step="any"
                      invalid={!!errors.pricePerLead}
                    />
                  </Field>
                  <Field label="Messages per lead" error={errors.messagesPerLead?.message}>
                    <ControlledNumberInput
                      control={form.control}
                      name="messagesPerLead"
                      min={1}
                      invalid={!!errors.messagesPerLead}
                    />
                  </Field>
                  <Field label={`Base fee / month (${currency})`} error={errors.baseFee?.message}>
                    <ControlledNumberInput
                      control={form.control}
                      name="baseFee"
                      step="any"
                      invalid={!!errors.baseFee}
                    />
                  </Field>
                </div>
                <div className="space-y-4 border-t border-default-200 pt-6">
                  <h5 className="text-xs font-semibold uppercase tracking-wide text-default-500">
                    Long-term discounts
                  </h5>
                  <div className="grid gap-x-5 gap-y-5 sm:grid-cols-3">
                    {DISCOUNT_INPUTS.map(discountInput => (
                      <Field
                        key={discountInput.name}
                        label={discountInput.label}
                        error={errors[discountInput.name]?.message}
                      >
                        <ControlledNumberInput
                          control={form.control}
                          name={discountInput.name}
                          placeholder="0"
                          invalid={!!errors[discountInput.name]}
                        />
                      </Field>
                    ))}
                  </div>
                </div>
              </div>
            </DisclosureSection>
          </section>
        </div>

        <aside className="self-start rounded-xl border border-default-200 bg-default-50 p-6 lg:sticky lg:top-0">
          <p className="text-xs font-medium uppercase tracking-wide text-default-500">Plan price</p>
          <AnimatedValue
            value={formatPlanPrice(quote.totalPrice, currency)}
            className={cn(
              'mt-2 text-3xl font-semibold tracking-tight transition-opacity',
              calculatorValues ? 'text-primary' : 'text-default-400'
            )}
          />
          <p className="mt-1.5 text-sm text-default-500">
            {LEAD_PRICED_DURATION_LABEL[selectedDuration]}, {quote.months}{' '}
            {quote.months === 1 ? 'month' : 'months'}
            {quote.months > 1 &&
              `, works out to ${formatPlanPrice(quote.effectiveMonthlyPrice, currency)} / month`}
          </p>

          <div className="mt-6 divide-y divide-default-200 border-t border-default-200">
            <ResultRow label="Leads / month" value={quote.monthlyLeads.toLocaleString('en-PK')} />
            <ResultRow
              label="Messages / month"
              value={quote.monthlyMessages.toLocaleString('en-PK')}
            />
            <ResultRow
              label="Leads cost / month"
              value={formatPlanPrice(quote.leadsCostPerMonth, currency)}
            />
            <ResultRow
              label="Base fee / month"
              value={formatPlanPrice(quote.baseFeePerMonth, currency)}
            />
            <ResultRow
              label="Price / month"
              value={formatPlanPrice(quote.monthlyPrice, currency)}
            />
            <ResultRow
              label={`Full price (${quote.months} mo)`}
              value={formatPlanPrice(quote.listPrice, currency)}
            />
            <ResultRow
              label={`Discount (${quote.discountPercent}%)`}
              value={
                quote.discountAmount > 0
                  ? `${formatPlanPrice(quote.discountAmount, currency)} off`
                  : 'None'
              }
            />
          </div>

          <p
            className={cn(
              'mt-5 text-xs',
              calculatorValues ? 'text-default-400' : 'font-medium text-danger'
            )}
          >
            {calculatorValues
              ? 'Updates as you type.'
              : 'Fix the highlighted fields to see the price.'}
          </p>
        </aside>
      </div>
    </MotionConfig>
  );
}
