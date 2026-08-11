import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ToggleRow } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { Plan } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, type ReactNode } from 'react';
import { Controller, useFieldArray, useForm, type Control } from 'react-hook-form';
import { LuArrowLeft, LuEye, LuLoaderCircle, LuPlus, LuX } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router';
import {
  emptyPlanDefaults,
  formValuesToPlanInput,
  planFormSchema,
  planToFormValues,
  UNIVERSAL,
  type PlanFormValues,
} from '../plan-form.schema';
import { useSavePlan } from '../plans.hooks';
import { PlanFormProgress } from './PlanFormProgress';
import { PlanPreviewDialog } from './PlanPreviewDialog';

type NumKey =
  | 'price'
  | 'wholesalePrice'
  | 'maxWorkspaces'
  | 'maxMembersPerWorkspace'
  | 'maxChannels'
  | 'maxProducts'
  | 'maxMenuItems'
  | 'maxServices'
  | 'maxMonthlyMessages'
  | 'maxImageMessages'
  | 'maxVoiceMessages';
type BoolKey = 'isTrial' | 'isPublic' | 'isActive' | 'isFeatured' | 'isComingSoon';

function NumberField({
  control,
  name,
  label,
  hint,
  placeholder = '0',
}: {
  control: Control<PlanFormValues>;
  name: NumKey;
  label: string;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field label={label} hint={hint} error={fieldState.error?.message}>
          <Input
            type="number"
            step="any"
            placeholder={placeholder}
            invalid={!!fieldState.error}
            value={field?.value?.toString() ?? ''}
            // valueAsNumber is NaN for an empty input; coerce to 0 so a
            // cleared field never submits NaN (which serializes to null).
            onChange={event =>
              field.onChange(
                Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber
              )
            }
          />
        </Field>
      )}
    />
  );
}

function ToggleField({
  control,
  name,
  label,
  hint,
}: {
  control: Control<PlanFormValues>;
  name: BoolKey;
  label: string;
  hint?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <ToggleRow
          label={label}
          description={hint}
          checked={field.value}
          onChange={event => field.onChange(event.target.checked)}
        />
      )}
    />
  );
}

/** Tailwick sectioned card: header carries the group title + description. */
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">{title}</h2>
        <p className="mt-0.5 text-sm text-default-500">{description}</p>
      </div>
      <div className="card-body space-y-4">{children}</div>
    </section>
  );
}

interface PlanFormViewProps {
  /** Present on the edit route; undefined when creating. */
  existingPlan?: Plan;
}

export function PlanFormView({ existingPlan }: PlanFormViewProps) {
  const navigate = useNavigate();
  const editing = !!existingPlan;

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: existingPlan ? planToFormValues(existingPlan) : emptyPlanDefaults(),
  });
  const featuresArray = useFieldArray({ control: form.control, name: 'features' });
  const savePlanMutation = useSavePlan();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewValues, setPreviewValues] = useState<PlanFormValues | null>(null);
  // Offer fields stay out of the way until the plan actually runs an offer.
  const [offerFieldsOpen, setOfferFieldsOpen] = useState(existingPlan?.originalPrice != null);

  // On the edit route the plan usually arrives after mount — re-seed then.
  useEffect(() => {
    if (!existingPlan) return;
    form.reset(planToFormValues(existingPlan));
    setOfferFieldsOpen(existingPlan.originalPrice != null);
  }, [existingPlan, form]);

  const vertical = form.watch('businessVertical');
  const duration = form.watch('duration');
  const isTrial = form.watch('isTrial');
  const currency = form.watch('currency');
  const price = form.watch('price');
  const originalPrice = form.watch('originalPrice');
  const { errors } = form.formState;

  const hasOffer = !isTrial && originalPrice != null && originalPrice > price;
  const discountPercentage = hasOffer ? Math.round((1 - price / originalPrice) * 100) : null;

  // Dropping the offer must clear both fields — a stray end date fails validation.
  const removeOffer = () => {
    setOfferFieldsOpen(false);
    form.setValue('originalPrice', null, { shouldDirty: true, shouldValidate: true });
    form.setValue('offerEndsAt', null, { shouldDirty: true, shouldValidate: true });
  };

  // Trials can't carry an offer — clear the now-hidden fields so the schema
  // doesn't reject the submit with an error nobody can see.
  useEffect(() => {
    if (!isTrial) return;
    setOfferFieldsOpen(false);
    const { originalPrice: currentOriginalPrice, offerEndsAt } = form.getValues();
    if (currentOriginalPrice == null && offerEndsAt == null) return;
    form.setValue('originalPrice', null, { shouldDirty: true, shouldValidate: true });
    form.setValue('offerEndsAt', null, { shouldDirty: true, shouldValidate: true });
  }, [isTrial, form]);

  const onSubmit = (values: PlanFormValues) => {
    savePlanMutation.mutate(
      { id: existingPlan?.id, input: formValuesToPlanInput(values, existingPlan) },
      { onSuccess: () => navigate('/plans') }
    );
  };

  return (
    <div className="mx-auto flex max-w-6xl gap-6">
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex items-center gap-3">
          <Link
            to="/plans"
            aria-label="Back to plans"
            className={buttonVariants({ variant: 'soft', size: 'icon-sm' })}
          >
            <LuArrowLeft className="size-4 rtl:rotate-180" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-default-900">
              {editing ? `Edit plan — ${existingPlan?.name}` : 'Create plan'}
            </h1>
            <p className="mt-0.5 text-sm text-default-500">
              Pricing, limits and how the plan appears on the landing page.
            </p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
          <FormSection
            title="Basics"
            description="Name, tier and which business category can subscribe."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" error={errors.name?.message}>
                <Input placeholder="Starter" invalid={!!errors.name} {...form.register('name')} />
              </Field>
              <Field label="Tier" error={errors.tier?.message}>
                <Select {...form.register('tier')}>
                  <option value="STARTER">Starter</option>
                  <option value="GROWTH">Growth</option>
                  <option value="AGENCY">Agency</option>
                  <option value="RESELLER">Reseller</option>
                </Select>
              </Field>
            </div>

            <Field
              label="Business category"
              hint="Scoping a plan limits it to that category's customers and only that category's resource count applies."
              error={errors.businessVertical?.message}
            >
              <Select {...form.register('businessVertical')}>
                <option value={UNIVERSAL}>All categories (universal)</option>
                <option value="ECOMMERCE">Online store / retail</option>
                <option value="RESTAURANT">Restaurant / food service</option>
                <option value="MARKETING_AGENCY">Marketing agency</option>
              </Select>
            </Field>

            <Field
              label="Tagline"
              hint="Short line shown under the plan name on the landing page."
              error={errors.tagline?.message}
            >
              <Textarea
                rows={2}
                placeholder="For solo owners getting started on WhatsApp."
                invalid={!!errors.tagline}
                {...form.register('tagline')}
              />
            </Field>
          </FormSection>

          <FormSection
            title="Pricing & offer"
            description="What customers pay and how often they're billed. Add an offer only when the plan is actually discounted."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Billing period" error={errors.duration?.message}>
                <Select invalid={!!errors.duration} {...form.register('duration')}>
                  <option value="DAYS_3">3 days</option>
                  <option value="DAYS_7">7 days</option>
                  <option value="DAYS_14">14 days</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="SEMI_ANNUAL">6 months</option>
                  <option value="ANNUAL">Annual</option>
                  <option value="CUSTOM_DAYS">Custom days (trial only)</option>
                </Select>
              </Field>
              {duration === 'CUSTOM_DAYS' ? (
                <Controller
                  control={form.control}
                  name="customDurationDays"
                  render={({ field, fieldState }) => (
                    <Field label="Trial length (days)" error={fieldState.error?.message}>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        invalid={!!fieldState.error}
                        value={field.value ?? ''}
                        onChange={event =>
                          field.onChange(
                            Number.isNaN(event.target.valueAsNumber)
                              ? null
                              : event.target.valueAsNumber
                          )
                        }
                      />
                    </Field>
                  )}
                />
              ) : (
                <Field label="Currency" error={errors.currency?.message}>
                  <Input maxLength={3} invalid={!!errors.currency} {...form.register('currency')} />
                </Field>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                control={form.control}
                name="price"
                label={`${isTrial ? 'Price' : 'Discounted price'} (${currency})`}
                hint={
                  isTrial ? 'Trial plans must be free (0).' : 'What the customer actually pays.'
                }
                placeholder="e.g. 4999"
              />
              <NumberField
                control={form.control}
                name="wholesalePrice"
                label={`Wholesale price (${currency})`}
                hint="Reseller cost — not shown publicly."
                placeholder="e.g. 3500"
              />
            </div>

            {!isTrial &&
              (offerFieldsOpen ? (
                <div className="space-y-4 rounded-lg border border-default-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium text-default-900">Limited-time offer</h3>
                      <p className="mt-0.5 text-sm text-default-500">
                        The actual price is shown struck through until the offer ends.
                      </p>
                    </div>
                    <Button type="button" variant="soft" size="sm" onClick={removeOffer}>
                      <LuX className="size-4" />
                      Remove offer
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Controller
                      control={form.control}
                      name="originalPrice"
                      render={({ field, fieldState }) => (
                        <Field
                          label={`Actual price (${currency})`}
                          hint="Pre-discount price shown struck through. Must be above the discounted price."
                          error={fieldState.error?.message}
                        >
                          <Input
                            type="number"
                            step="any"
                            min={0}
                            placeholder="e.g. 5999"
                            invalid={!!fieldState.error}
                            value={field.value ?? ''}
                            onChange={event =>
                              field.onChange(
                                Number.isNaN(event.target.valueAsNumber)
                                  ? null
                                  : event.target.valueAsNumber
                              )
                            }
                          />
                        </Field>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="offerEndsAt"
                      render={({ field, fieldState }) => (
                        <Field
                          label="Offer ends on"
                          hint={
                            field.value
                              ? 'The landing page can show a countdown to this date.'
                              : 'Optional — leave empty for an open-ended offer.'
                          }
                          error={fieldState.error?.message}
                        >
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Pick a date"
                            disabled={!hasOffer}
                            invalid={!!fieldState.error}
                          />
                        </Field>
                      )}
                    />
                  </div>

                  {hasOffer && (
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-default-200 bg-default-50 px-4 py-3 text-sm">
                      <Badge tone="success">{discountPercentage}% off</Badge>
                      <span className="text-default-500">
                        Customers see{' '}
                        <s>
                          {currency} {originalPrice.toLocaleString()}
                        </s>{' '}
                        <span className="font-medium text-default-800">
                          {currency} {price.toLocaleString()}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="dashed-primary"
                  size="sm"
                  onClick={() => setOfferFieldsOpen(true)}
                >
                  <LuPlus className="size-4" />
                  Add limited-time offer
                </Button>
              ))}

            <ToggleField
              control={form.control}
              name="isTrial"
              label="Free trial plan"
              hint="Free plans can use custom day durations."
            />
          </FormSection>

          <FormSection
            title="Workspaces & team"
            description="Seat limits applied across the subscriber's account."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField
                control={form.control}
                name="maxWorkspaces"
                label="Workspaces"
                placeholder="e.g. 3"
              />
              <NumberField
                control={form.control}
                name="maxMembersPerWorkspace"
                label="Team members"
                placeholder="e.g. 10"
              />
              <NumberField
                control={form.control}
                name="maxChannels"
                label="Channels"
                placeholder="e.g. 2"
              />
            </div>
          </FormSection>

          <FormSection
            title="Resource limits"
            description="Catalogue ceilings — only the chosen category's counter applies."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              {(vertical === UNIVERSAL || vertical === 'ECOMMERCE') && (
                <NumberField
                  control={form.control}
                  name="maxProducts"
                  label="Products"
                  placeholder="e.g. 200"
                />
              )}
              {(vertical === UNIVERSAL || vertical === 'RESTAURANT') && (
                <NumberField
                  control={form.control}
                  name="maxMenuItems"
                  label="Menu items"
                  placeholder="e.g. 100"
                />
              )}
              {(vertical === UNIVERSAL || vertical === 'MARKETING_AGENCY') && (
                <NumberField
                  control={form.control}
                  name="maxServices"
                  label="Services"
                  placeholder="e.g. 50"
                />
              )}
            </div>
          </FormSection>

          <FormSection
            title="Message limits"
            description="Monthly AI message ceiling; image and voice are carved out of the total."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField
                control={form.control}
                name="maxMonthlyMessages"
                label="Total / month"
                placeholder="e.g. 2000"
              />
              <NumberField
                control={form.control}
                name="maxImageMessages"
                label="Image vision"
                hint="Carved out of the total"
                placeholder="e.g. 500"
              />
              <NumberField
                control={form.control}
                name="maxVoiceMessages"
                label="Voice messages"
                hint="Carved out of the total"
                placeholder="e.g. 200"
              />
            </div>
          </FormSection>

          <FormSection
            title="Landing page display"
            description="How this plan's card is presented on the public pricing section."
          >
            <div>
              <span className="form-label mb-2 block text-sm font-medium text-default-700">
                Feature bullets
              </span>
              <div className="space-y-2">
                {featuresArray.fields.map((featureField, featureIndex) => (
                  <Controller
                    key={featureField.id}
                    control={form.control}
                    name={`features.${featureIndex}.value`}
                    render={({ field, fieldState }) => (
                      <Field error={fieldState.error?.message}>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Unlimited AI-powered replies"
                            invalid={!!fieldState.error}
                            {...field}
                          />
                          <Button
                            aria-label="Remove feature"
                            variant="soft-danger"
                            size="icon-sm"
                            className="shrink-0 bg-transparent"
                            onClick={() => featuresArray.remove(featureIndex)}
                          >
                            <LuX className="size-4" />
                          </Button>
                        </div>
                      </Field>
                    )}
                  />
                ))}
                <Button
                  variant="dashed-primary"
                  size="sm"
                  onClick={() => featuresArray.append({ value: '' })}
                >
                  <LuPlus className="size-4 me-1" /> Add feature
                </Button>
                <p className="text-xs text-default-400">Listed on the plan card in this order.</p>
              </div>
            </div>

            <Field
              label="Button label"
              hint="Call-to-action text on the plan card. Leave empty for the default."
              error={errors.ctaLabel?.message}
            >
              <Input
                placeholder="Start With Starter"
                invalid={!!errors.ctaLabel}
                {...form.register('ctaLabel')}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <ToggleField
                control={form.control}
                name="isFeatured"
                label="Featured plan"
                hint="Highlighted as the recommended choice."
              />
              <ToggleField
                control={form.control}
                name="isComingSoon"
                label="Coming soon"
                hint="Shown on the card but not purchasable."
              />
            </div>
          </FormSection>

          <FormSection
            title="Visibility"
            description="Whether the plan is offered publicly and can be subscribed to."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ToggleField
                control={form.control}
                name="isPublic"
                label="Public"
                hint="Listed on pricing pages."
              />
              <ToggleField
                control={form.control}
                name="isActive"
                label="Active"
                hint="Inactive plans can't be subscribed to."
              />
            </div>
          </FormSection>

          <div className="sticky bottom-0 z-20 -mx-2 flex items-center justify-end gap-3 border-t border-default-200 bg-body-bg/95 px-2 py-4 backdrop-blur">
            <Button
              variant="outline"
              className="me-auto"
              onClick={() => {
                setPreviewValues(form.getValues());
                setPreviewOpen(true);
              }}
            >
              <LuEye className="size-4 me-1.5" /> Preview
            </Button>
            <Link to="/plans" className={buttonVariants({ variant: 'ghost' })}>
              Cancel
            </Link>
            <Button type="submit" disabled={savePlanMutation.isPending}>
              {savePlanMutation.isPending && (
                <LuLoaderCircle className="size-4 me-1.5 animate-spin" />
              )}
              {savePlanMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create plan'}
            </Button>
          </div>
        </form>

        <PlanPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          values={previewValues}
        />
      </div>

      <aside className="hidden w-64 shrink-0 lg:block">
        <PlanFormProgress control={form.control} />
      </aside>
    </div>
  );
}
