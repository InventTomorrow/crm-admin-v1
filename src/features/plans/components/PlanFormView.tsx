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
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Controller, useFieldArray, useForm, type Control } from 'react-hook-form';
import { LuArrowLeft, LuLoaderCircle, LuPlus, LuRefreshCw, LuX } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router';
import { deriveFeatureBullets } from '../plan-features.util';
import {
  emptyPlanDefaults,
  formValuesToPlanInput,
  planFormSchema,
  planToFormValues,
  UNIVERSAL,
  type PlanFormValues,
} from '../plan-form.schema';
import { useSavePlan } from '../plans.hooks';
import { PlanLivePreview } from './PlanLivePreview';

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
  disabled = false,
}: {
  control: Control<PlanFormValues>;
  name: BoolKey;
  label: string;
  hint?: string;
  /** For toggles another field drives — shown, but not editable here. */
  disabled?: boolean;
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
          disabled={disabled}
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

  /**
   * The limit fields are the plan's selling points, so the bullets are written
   * from them rather than retyped. Auto-sync lasts only while the admin hasn't
   * touched the list — the moment they edit, add or remove a bullet the list is
   * theirs and we stop overwriting it. An existing plan's saved bullets are
   * treated as already-authored for the same reason.
   */
  const [featuresAreAuto, setFeaturesAreAuto] = useState(!existingPlan);
  const watchedValues = form.watch();
  const derivedFeatures = useMemo(() => deriveFeatureBullets(watchedValues), [watchedValues]);
  const derivedSignature = derivedFeatures.join('|');

  useEffect(() => {
    if (!featuresAreAuto) return;
    const current = form.getValues('features').map(feature => feature.value);
    if (current.join('|') === derivedSignature) return;
    form.setValue(
      'features',
      derivedFeatures.map(value => ({ value })),
      { shouldDirty: true }
    );
  }, [featuresAreAuto, derivedSignature, derivedFeatures, form]);

  /** Any hands-on change to the list hands ownership to the admin. */
  const takeOverFeatures = () => setFeaturesAreAuto(false);

  const regenerateFeatures = () => {
    setFeaturesAreAuto(true);
    form.setValue(
      'features',
      derivedFeatures.map(value => ({ value })),
      { shouldDirty: true, shouldValidate: true }
    );
  };
  const savePlanMutation = useSavePlan();
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
  const tier = form.watch('tier');
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

  // The tier owns the trial flag. Picking TRIAL turns it on (and zeroes the
  // price, which a trial must have); picking anything else turns it off — so
  // the pair can never be submitted in the contradictory state both schemas
  // reject.
  useEffect(() => {
    const shouldBeTrial = tier === 'TRIAL';
    if (form.getValues('isTrial') === shouldBeTrial) return;
    form.setValue('isTrial', shouldBeTrial, { shouldDirty: true, shouldValidate: true });
    if (shouldBeTrial && form.getValues('price') !== 0) {
      form.setValue('price', 0, { shouldDirty: true, shouldValidate: true });
    }
  }, [tier, form]);

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
    <div className="mx-auto flex max-w-[1400px] gap-6">
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
                  <option value="TRIAL">Trial</option>
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

            {/* Read-only: the Tier select above is what sets this. */}
            <ToggleField
              control={form.control}
              name="isTrial"
              label="Free trial plan"
              hint="Set by the TRIAL tier. Trial plans are free and can use custom day durations."
              disabled
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
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="form-label block text-sm font-medium text-default-700">
                  Feature bullets
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={regenerateFeatures}
                  disabled={derivedFeatures.length === 0}
                >
                  <LuRefreshCw className="size-3.5 me-1" />
                  {featuresArray.fields.length > 0 ? 'Rewrite from limits' : 'Generate from limits'}
                </Button>
              </div>
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
                            onChange={event => {
                              takeOverFeatures();
                              field.onChange(event);
                            }}
                          />
                          <Button
                            aria-label="Remove feature"
                            variant="soft-danger"
                            size="icon-sm"
                            className="shrink-0 bg-transparent"
                            onClick={() => {
                              takeOverFeatures();
                              featuresArray.remove(featureIndex);
                            }}
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
                <p className="text-xs text-default-400">
                  {featuresAreAuto
                    ? 'Written automatically from the limits above, and kept in step until you edit them. Change any bullet to take over.'
                    : 'Listed on the plan card in this order. “Rewrite from limits” restores the generated set.'}
                </p>
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
      </div>

      {/* Sticky rail: the preview stays in view while the form scrolls past it. */}
      <aside className="hidden w-[380px] shrink-0 xl:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
          <PlanLivePreview values={watchedValues} />
        </div>
      </aside>
    </div>
  );
}
