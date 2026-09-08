import { PermissionGuard } from '@/components/PermissionGuard';
import { LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { ControlledNumberInput } from '@/components/ui/controlled-number-input';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SearchSelect } from '@/components/ui/search-select';
import { Select } from '@/components/ui/select';
import { usePermissions } from '@/features/auth/auth.hooks';
import { formatDate } from '@/lib/format';
import { SystemPermissions } from '@/lib/permissions';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { LuCalculator, LuCoins, LuLoaderCircle } from 'react-icons/lu';
import { z } from 'zod';
import {
  useAddModelPricing,
  useCurrentPricing,
  useExchangeRate,
  useUpdateExchangeRate,
} from '../ai-pricing.hooks';
import { AI_PROVIDERS, PROVIDER_LABELS, modelsForProvider } from '../model-catalog';
import { AiCostCalculatorDialog } from './AiCostCalculatorDialog';

const pricingFormSchema = z.object({
  provider: z.string().trim().min(1, 'Required'),
  model: z.string().trim().min(1, 'Required'),
  inputPricePerMillionTokens: z.number().min(0, 'Must be 0 or more'),
  cachedInputPricePerMillionTokens: z.number().min(0).nullable(),
  outputPricePerMillionTokens: z.number().min(0, 'Must be 0 or more'),
});
type PricingFormValues = z.infer<typeof pricingFormSchema>;

const exchangeRateFormSchema = z.object({
  usdToPkrRate: z.number().positive('Must be greater than 0'),
});
type ExchangeRateFormValues = z.infer<typeof exchangeRateFormSchema>;

/**
 * Per-model $/1M-token rates (input/cached/output) and the USD→PKR rate used to
 * show AI cost across tenants and users. No provider exposes a pricing API, so
 * every number here is manually entered — this card doubles as the "what's
 * currently on file" confirmation view.
 */

// TODO:// update the pricing page as well,
// make the dialog for add price, and show the current pricings of the model openly for the same model (price of one model openly and all other move to recent model prices )  recent pricing in the data table with proper filters including provider

export function AiPricingSettingsCard() {
  const { can } = usePermissions();
  const canEdit = can(SystemPermissions.SETTINGS_EDIT);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [modelQuery, setModelQuery] = useState('');

  const { data: pricing, isLoading: pricingLoading } = useCurrentPricing();
  const addPricingMutation = useAddModelPricing();

  const { data: exchangeRate, isLoading: rateLoading } = useExchangeRate();
  const updateRateMutation = useUpdateExchangeRate();

  const pricingForm = useForm<PricingFormValues>({
    resolver: zodResolver(pricingFormSchema),
    defaultValues: {
      provider: 'openai',
      model: '',
      inputPricePerMillionTokens: 0,
      cachedInputPricePerMillionTokens: null,
      outputPricePerMillionTokens: 0,
    },
  });

  const rateForm = useForm<ExchangeRateFormValues>({
    resolver: zodResolver(exchangeRateFormSchema),
    defaultValues: { usdToPkrRate: 0 },
  });
  useEffect(() => {
    if (exchangeRate !== null && exchangeRate !== undefined) {
      rateForm.reset({ usdToPkrRate: exchangeRate });
    }
  }, [exchangeRate, rateForm]);

  const submitPricing = pricingForm.handleSubmit(values => {
    addPricingMutation.mutate(
      {
        provider: values.provider,
        model: values.model,
        inputPricePerMillionTokens: values.inputPricePerMillionTokens,
        cachedInputPricePerMillionTokens: values.cachedInputPricePerMillionTokens,
        outputPricePerMillionTokens: values.outputPricePerMillionTokens,
        currency: 'USD',
      },
      {
        onSuccess: () => {
          pricingForm.reset();
          setModelQuery('');
        },
      }
    );
  });
  const pricingProviderValue = pricingForm.watch('provider');

  const submitRate = rateForm.handleSubmit(values => {
    updateRateMutation.mutate(values.usdToPkrRate);
  });

  return (
    <div className="card py-4">
      <div className="card-header flex items-start justify-between gap-3">
        <h6 className="card-title flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LuCoins className="size-4" />
          </span>
          AI model pricing
        </h6>
        <Button type="button" variant="outline" size="sm" onClick={() => setCalculatorOpen(true)}>
          <LuCalculator className="size-4 me-1.5" /> Cost calculator
        </Button>
      </div>
      <div className="card-body space-y-6">
        <p className="text-sm text-default-500">
          No provider publishes a pricing API rates below are entered here manually and used to cost
          every tenant's AI usage. Adding a price never edits an existing one: it's a new rate
          effective from now, so past usage still costs at the rate that was active then.
        </p>

        {pricingLoading ? (
          <LoadingState />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-default-200">
              <thead className="bg-default-150">
                <tr className="text-sm font-normal text-default-700">
                  <th className="px-3.5 py-3 text-start">Model</th>
                  <th className="px-3.5 py-3 text-start">Input $/1M</th>
                  <th className="px-3.5 py-3 text-start">Cached input $/1M</th>
                  <th className="px-3.5 py-3 text-start">Output $/1M</th>
                  <th className="px-3.5 py-3 text-start">Effective from</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-200">
                {(pricing ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3.5 py-4 text-sm text-default-500">
                      No pricing entered yet.
                    </td>
                  </tr>
                )}
                {pricing?.map(row => (
                  <tr key={row.id} className="text-sm text-default-800">
                    <td className="px-3.5 py-3 font-medium">
                      {row.provider} / {row.model}
                    </td>
                    <td className="px-3.5 py-3 tabular-nums">
                      ${row.inputPricePerMillionTokens.toFixed(2)}
                    </td>
                    <td className="px-3.5 py-3 tabular-nums text-default-500">
                      {row.cachedInputPricePerMillionTokens === null
                        ? '—'
                        : `$${row.cachedInputPricePerMillionTokens.toFixed(2)}`}
                    </td>
                    <td className="px-3.5 py-3 tabular-nums">
                      ${row.outputPricePerMillionTokens.toFixed(2)}
                    </td>
                    <td className="px-3.5 py-3 text-default-500">
                      {formatDate(row.effectiveFrom)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <PermissionGuard permission={SystemPermissions.SETTINGS_EDIT}>
          <form
            onSubmit={submitPricing}
            noValidate
            className="space-y-3 border-t border-default-200 pt-4"
          >
            <p className="text-sm font-medium text-default-800">Add a price</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
              <Field label="Provider" error={pricingForm.formState.errors.provider?.message}>
                <Controller
                  control={pricingForm.control}
                  name="provider"
                  render={({ field }) => (
                    <Select
                      {...field}
                      onChange={event => {
                        field.onChange(event.target.value);
                        pricingForm.setValue('model', '');
                        setModelQuery('');
                      }}
                    >
                      {AI_PROVIDERS.map(p => (
                        <option key={p} value={p}>
                          {PROVIDER_LABELS[p]}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </Field>
              <Field label="Model" error={pricingForm.formState.errors.model?.message}>
                <Controller
                  control={pricingForm.control}
                  name="model"
                  render={({ field }) => (
                    <SearchSelect
                      options={modelsForProvider(pricingProviderValue, pricing ?? [])
                        .filter(m => m.toLowerCase().includes(modelQuery.toLowerCase()))
                        .map(m => ({ id: m, label: m }))}
                      value={field.value ? { id: field.value, label: field.value } : null}
                      onSelect={option => field.onChange(option?.id ?? '')}
                      onCreate={query => {
                        field.onChange(query);
                        setModelQuery('');
                      }}
                      query={modelQuery}
                      onQueryChange={setModelQuery}
                      placeholder="Select or type a model…"
                      invalid={!!pricingForm.formState.errors.model}
                    />
                  )}
                />
              </Field>
              <Field
                label="Input $/1M"
                error={pricingForm.formState.errors.inputPricePerMillionTokens?.message}
              >
                <ControlledNumberInput
                  control={pricingForm.control}
                  name="inputPricePerMillionTokens"
                  step="0.01"
                  placeholder="0.00"
                />
              </Field>
              <Field label="Cached input $/1M" hint="Optional">
                <Controller
                  control={pricingForm.control}
                  name="cachedInputPricePerMillionTokens"
                  render={({ field }) => (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={field.value ?? ''}
                      onChange={event =>
                        field.onChange(
                          Number.isNaN(event.target.valueAsNumber)
                            ? null
                            : event.target.valueAsNumber
                        )
                      }
                    />
                  )}
                />
              </Field>
              <Field
                label="Output $/1M"
                error={pricingForm.formState.errors.outputPricePerMillionTokens?.message}
              >
                <ControlledNumberInput
                  control={pricingForm.control}
                  name="outputPricePerMillionTokens"
                  step="0.01"
                  placeholder="0.00"
                />
              </Field>
            </div>
            <Button type="submit" size="sm" disabled={addPricingMutation.isPending}>
              {addPricingMutation.isPending && (
                <LuLoaderCircle className="size-4 me-1.5 animate-spin" />
              )}
              {addPricingMutation.isPending ? 'Saving…' : 'Add price'}
            </Button>
          </form>
        </PermissionGuard>

        <form
          onSubmit={submitRate}
          noValidate
          className="flex flex-wrap items-end gap-3 border-t border-default-200 pt-4"
        >
          <Field
            label="USD → PKR rate"
            hint="Used to show a secondary PKR figure alongside every USD cost, until changed again."
            error={rateForm.formState.errors.usdToPkrRate?.message}
          >
            <ControlledNumberInput
              control={rateForm.control}
              name="usdToPkrRate"
              step="0.01"
              placeholder="0.00"
              className="w-40"
              disabled={rateLoading || !canEdit}
            />
          </Field>
          <PermissionGuard permission={SystemPermissions.SETTINGS_EDIT}>
            <Button type="submit" size="sm" disabled={updateRateMutation.isPending}>
              {updateRateMutation.isPending ? 'Saving…' : 'Save rate'}
            </Button>
          </PermissionGuard>
        </form>
      </div>

      <AiCostCalculatorDialog
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
        availableModels={pricing ?? []}
      />
    </div>
  );
}
