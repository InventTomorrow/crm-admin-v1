import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { LuLoaderCircle } from 'react-icons/lu';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { ControlledNumberInput } from '@/components/ui/controlled-number-input';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { SearchSelect } from '@/components/ui/search-select';
import { Select } from '@/components/ui/select';
import type { AiModelPricing } from '@/lib/types';
import { useAddModelPricing } from '../ai-pricing.hooks';
import { AI_PROVIDERS, PROVIDER_LABELS, modelsForProvider } from '../model-catalog';

const pricingFormSchema = z.object({
  provider: z.string().trim().min(1, 'Required'),
  model: z.string().trim().min(1, 'Required'),
  inputPricePerMillionTokens: z.number().min(0, 'Must be 0 or more'),
  cachedInputPricePerMillionTokens: z.number().min(0).nullable(),
  outputPricePerMillionTokens: z.number().min(0, 'Must be 0 or more'),
});
type PricingFormValues = z.infer<typeof pricingFormSchema>;

/**
 * Adding a price never edits an existing one: it's a new rate effective from
 * now, so past usage still costs at the rate that was active then.
 */
export function AiAddPricingDialog({
  open,
  onOpenChange,
  availableModels,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableModels: AiModelPricing[];
}) {
  const [modelQuery, setModelQuery] = useState('');
  const addPricingMutation = useAddModelPricing();

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingFormSchema),
    defaultValues: {
      provider: 'openai',
      model: '',
      inputPricePerMillionTokens: 0,
      cachedInputPricePerMillionTokens: null,
      outputPricePerMillionTokens: 0,
    },
  });
  const providerValue = form.watch('provider');

  const reset = () => {
    form.reset();
    setModelQuery('');
  };

  const submit = form.handleSubmit(values => {
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
          reset();
          onOpenChange(false);
        },
      }
    );
  });

  return (
    <Modal
      open={open}
      onOpenChange={next => {
        onOpenChange(next);
        if (!next) reset();
      }}
      title="Add a price"
      size="lg"
      footer={
        <Button type="submit" form="add-pricing-form" disabled={addPricingMutation.isPending}>
          {addPricingMutation.isPending && (
            <LuLoaderCircle className="size-4 me-1.5 animate-spin" />
          )}
          {addPricingMutation.isPending ? 'Saving…' : 'Add price'}
        </Button>
      }
    >
      <form id="add-pricing-form" onSubmit={submit} noValidate className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Provider" error={form.formState.errors.provider?.message}>
            <Controller
              control={form.control}
              name="provider"
              render={({ field }) => (
                <Select
                  {...field}
                  onChange={event => {
                    field.onChange(event.target.value);
                    form.setValue('model', '');
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
          <Field label="Model" error={form.formState.errors.model?.message}>
            <Controller
              control={form.control}
              name="model"
              render={({ field }) => (
                <SearchSelect
                  options={modelsForProvider(providerValue, availableModels)
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
                  invalid={!!form.formState.errors.model}
                />
              )}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field
            label="Input $/1M"
            error={form.formState.errors.inputPricePerMillionTokens?.message}
          >
            <ControlledNumberInput
              control={form.control}
              name="inputPricePerMillionTokens"
              step="0.01"
              placeholder="0.00"
            />
          </Field>
          <Field label="Cached input $/1M" hint="Optional">
            <Controller
              control={form.control}
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
                      Number.isNaN(event.target.valueAsNumber) ? null : event.target.valueAsNumber
                    )
                  }
                />
              )}
            />
          </Field>
          <Field
            label="Output $/1M"
            error={form.formState.errors.outputPricePerMillionTokens?.message}
          >
            <ControlledNumberInput
              control={form.control}
              name="outputPricePerMillionTokens"
              step="0.01"
              placeholder="0.00"
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
