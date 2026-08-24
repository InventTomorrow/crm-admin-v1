import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { LuCopy, LuLoaderCircle, LuPlus } from 'react-icons/lu';
import { toast } from 'sonner';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { SearchSelectOption } from '@/components/ui/search-select';
import { Modal } from '@/components/ui/modal';
import { listPlans } from '@/features/plans/plans.api';
import { CrmUserSearchSelect } from '@/features/users/components/CrmUserSearchSelect';
import {
  formatPlanPeriod,
  formatPlanPeriodCountLabel,
  formatPlanPrice,
} from '@/lib/planFormat';
import { useCreateCheckoutLink } from '../links.hooks';
import { createCheckoutLinkSchema, type CreateCheckoutLinkFormValues } from '../types';
import { Button } from '@/components/ui/button';

/**
 * Workflow 2 step 1 — generate a single-use link the customer opens to enter
 * their details and upload a payment receipt. Attaching a CRM account is
 * optional: leave it blank when selling to someone not onboarded yet, and
 * pick the account at approval time instead.
 */
export function CreateCheckoutLinkDialog() {
  const [open, setOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<SearchSelectOption | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const createLinkMutation = useCreateCheckoutLink();

  const form = useForm<CreateCheckoutLinkFormValues>({
    resolver: zodResolver(createCheckoutLinkSchema),
    defaultValues: {
      planId: '',
      ownerUserId: '',
      periodCount: 1,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      expiresInDays: 7,
    },
  });
  const { errors } = form.formState;

  const plansQuery = useQuery({ queryKey: ['plans'], queryFn: listPlans, enabled: open });
  const plans = plansQuery.data ?? [];

  // The customer is quoted the whole span, so the admin sees that total here
  // rather than the per-period price the plan dropdown shows.
  const watchedPlanId = form.watch('planId');
  const watchedPeriodCount = form.watch('periodCount');
  const selectedPlan = plans.find(plan => plan.id === watchedPlanId) ?? null;
  const countLabel = selectedPlan ? formatPlanPeriodCountLabel(selectedPlan.duration) : 'Periods';
  const totalDue =
    selectedPlan && watchedPeriodCount > 0 ? selectedPlan.price * watchedPeriodCount : null;

  const closeAndReset = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset();
      setSelectedOwner(null);
      setCreatedUrl(null);
    }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  const onSubmit = (values: CreateCheckoutLinkFormValues) =>
    createLinkMutation.mutate(
      {
        planId: values.planId,
        periodCount: values.periodCount,
        // The link belongs to the CRM account owner (server contract) — not a
        // workspace. Fixed from the old admin, which sent an unknown tenantId
        // field the API silently dropped.
        ...(values.ownerUserId ? { ownerUserId: values.ownerUserId } : {}),
        ...(values.customerName?.trim() ? { customerName: values.customerName.trim() } : {}),
        ...(values.customerEmail?.trim() ? { customerEmail: values.customerEmail.trim() } : {}),
        ...(values.customerPhone?.trim() ? { customerPhone: values.customerPhone.trim() } : {}),
        expiresInDays: values.expiresInDays,
      },
      { onSuccess: link => setCreatedUrl(link.url) }
    );

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <LuPlus className="size-4 me-1" /> New link
      </Button>

      <Modal open={open} onOpenChange={closeAndReset} title="Send a checkout link" size="sm">
        {createdUrl ? (
          <div className="space-y-3">
            <span className="form-label block text-sm font-medium text-default-700">
              Share this link
            </span>
            <div className="flex items-center gap-2">
              <Input readOnly value={createdUrl} className="font-mono text-xs" />
              <Button
                aria-label="Copy link"
                size="icon"
                className="shrink-0"
                onClick={() => copyUrl(createdUrl)}
              >
                <LuCopy className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-default-400">
              Single-use — it stops working once the customer submits.
            </p>
            <Button className="w-full" onClick={() => closeAndReset(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-default-500">
              The customer opens this link to enter their details and upload a payment receipt,
              which lands in your approval queue.
            </p>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
              <Controller
                control={form.control}
                name="ownerUserId"
                render={({ field }) => (
                  <Field
                    label="CRM account (optional)"
                    hint="Leave blank when selling to someone not onboarded yet."
                  >
                    <CrmUserSearchSelect
                      value={selectedOwner}
                      onSelect={owner => {
                        setSelectedOwner(owner);
                        field.onChange(owner?.id ?? '');
                      }}
                      enabled={open}
                      placeholder="Not linked to an account yet"
                      clearable
                    />
                  </Field>
                )}
              />

              <Field label="Plan" required error={errors.planId?.message}>
                <Select invalid={!!errors.planId} {...form.register('planId')}>
                  <option value="">Select a plan</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — {formatPlanPrice(plan.price, plan.currency)}/
                      {formatPlanPeriod(plan.duration, plan.customDurationDays)}
                    </option>
                  ))}
                </Select>
              </Field>

              <Controller
                control={form.control}
                name="periodCount"
                render={({ field, fieldState }) => (
                  <Field
                    label={`${countLabel} sold`}
                    error={fieldState.error?.message}
                    hint={
                      totalDue !== null && selectedPlan
                        ? `The customer is asked to transfer ${formatPlanPrice(
                            totalDue,
                            selectedPlan.currency
                          )} in total.`
                        : 'How many plan periods this link sells.'
                    }
                  >
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      step={1}
                      invalid={!!fieldState.error}
                      value={Number.isNaN(field.value) ? '' : field.value}
                      onChange={event =>
                        field.onChange(
                          Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber
                        )
                      }
                    />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="expiresInDays"
                render={({ field, fieldState }) => (
                  <Field
                    label="Link expires in (days)"
                    error={fieldState.error?.message}
                    hint="How long the customer has to open this link — not the subscription length."
                  >
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      invalid={!!fieldState.error}
                      value={Number.isNaN(field.value) ? '' : field.value}
                      onChange={event =>
                        field.onChange(
                          Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber
                        )
                      }
                    />
                  </Field>
                )}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Customer name">
                  <Input placeholder="Optional prefill" {...form.register('customerName')} />
                </Field>
                <Field label="Email" error={errors.customerEmail?.message}>
                  <Input
                    type="email"
                    placeholder="Optional prefill"
                    invalid={!!errors.customerEmail}
                    {...form.register('customerEmail')}
                  />
                </Field>
                <Field label="Phone">
                  <Input placeholder="Optional prefill" {...form.register('customerPhone')} />
                </Field>
              </div>

              <Button type="submit" className="mt-2 w-full" disabled={createLinkMutation.isPending}>
                {createLinkMutation.isPending && (
                  <LuLoaderCircle className="size-4 me-1.5 animate-spin" />
                )}
                {createLinkMutation.isPending ? 'Creating…' : 'Create link'}
              </Button>
            </form>
          </>
        )}
      </Modal>
    </>
  );
}
