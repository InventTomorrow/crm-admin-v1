import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from 'react-hook-form';
import { z } from 'zod';
import { LuLoaderCircle, LuPlus, LuTrash2 } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { ControlledNumberInput } from '@/components/ui/controlled-number-input';
import { Field } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { SearchSelect, type SearchSelectOption } from '@/components/ui/search-select';
import type { AiModelPricing, ModelCostBreakdown } from '@/lib/types';
import { AI_PROVIDERS, PROVIDER_LABELS, modelsForProvider, priceHint } from '../model-catalog';
import type { CalculateCostItem } from '../ai-pricing.api';
import { useCalculateHypotheticalCost } from '../ai-pricing.hooks';

const usageRowSchema = z.object({
  promptTokens: z.number().int().min(0),
  cachedTokens: z.number().int().min(0),
  completionTokens: z.number().int().min(0),
});
const modelGroupSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1, 'Pick a model'),
  rows: z.array(usageRowSchema).min(1),
});
const formSchema = z.object({ groups: z.array(modelGroupSchema).min(1) });
type FormValues = z.infer<typeof formSchema>;
type ModelGroup = FormValues['groups'][number];

function emptyUsageRow(): ModelGroup['rows'][number] {
  return { promptTokens: 0, cachedTokens: 0, completionTokens: 0 };
}

function emptyGroup(): ModelGroup {
  return { provider: 'openai', model: '', rows: [emptyUsageRow()] };
}

/** Sums every row's tokens within a group — one calculator item per model, not per row. */
function toCalculateItems(groups: ModelGroup[]): CalculateCostItem[] {
  return groups.map(group => ({
    provider: group.provider,
    model: group.model,
    promptTokens: group.rows.reduce((sum, row) => sum + row.promptTokens, 0),
    cachedTokens: group.rows.reduce((sum, row) => sum + row.cachedTokens, 0),
    completionTokens: group.rows.reduce((sum, row) => sum + row.completionTokens, 0),
  }));
}

/** One provider+model picker, with any number of token-count rows summed under it. */
function ModelGroupCard({
  control,
  groupIndex,
  setValue,
  errors,
  availableModels,
  canRemoveGroup,
  onRemoveGroup,
}: {
  control: Control<FormValues>;
  groupIndex: number;
  setValue: UseFormSetValue<FormValues>;
  errors: FieldErrors<FormValues>;
  availableModels: AiModelPricing[];
  canRemoveGroup: boolean;
  onRemoveGroup: () => void;
}) {
  const {
    fields: rowFields,
    append: appendRow,
    remove: removeRow,
  } = useFieldArray({ control, name: `groups.${groupIndex}.rows` });
  const [modelQuery, setModelQuery] = useState('');
  const provider = useWatch({ control, name: `groups.${groupIndex}.provider` });
  const model = useWatch({ control, name: `groups.${groupIndex}.model` });
  const modelOptions: SearchSelectOption[] = modelsForProvider(provider, availableModels)
    .filter(m => m.toLowerCase().includes(modelQuery.toLowerCase()))
    .map(m => ({ id: m, label: m }));
  const hint = model ? priceHint(provider, model, availableModels) : null;

  return (
    <div className="rounded-lg border border-default-200 p-3">
      <div className="flex items-start gap-2">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Provider">
            <Controller
              control={control}
              name={`groups.${groupIndex}.provider`}
              render={({ field: providerField }) => (
                <Select
                  {...providerField}
                  onChange={event => {
                    providerField.onChange(event.target.value);
                    setValue(`groups.${groupIndex}.model`, '');
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

          <Field
            label="Model"
            error={errors.groups?.[groupIndex]?.model?.message}
            hint={hint ?? (model ? 'No price entered for this model yet' : undefined)}
          >
            <Controller
              control={control}
              name={`groups.${groupIndex}.model`}
              render={({ field: modelField }) => (
                <SearchSelect
                  options={modelOptions}
                  value={model ? { id: model, label: model } : null}
                  onSelect={option => modelField.onChange(option?.id ?? '')}
                  onCreate={query => {
                    modelField.onChange(query);
                    setModelQuery('');
                  }}
                  query={modelQuery}
                  onQueryChange={setModelQuery}
                  placeholder="Select or type a model…"
                  invalid={!!errors.groups?.[groupIndex]?.model}
                />
              )}
            />
          </Field>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-7"
          disabled={!canRemoveGroup}
          onClick={onRemoveGroup}
          aria-label="Remove model"
        >
          <LuTrash2 className="size-4" />
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        {rowFields.map((rowField, rowIndex) => (
          <div key={rowField.id} className="grid grid-cols-3 gap-2">
            <Field label={rowIndex === 0 ? 'Prompt tokens' : undefined}>
              <ControlledNumberInput
                control={control}
                name={`groups.${groupIndex}.rows.${rowIndex}.promptTokens`}
              />
            </Field>
            <Field label={rowIndex === 0 ? 'Cached tokens' : undefined}>
              <ControlledNumberInput
                control={control}
                name={`groups.${groupIndex}.rows.${rowIndex}.cachedTokens`}
              />
            </Field>
            <Field label={rowIndex === 0 ? 'Completion tokens' : undefined}>
              <div className="flex items-center gap-2">
                <ControlledNumberInput
                  control={control}
                  name={`groups.${groupIndex}.rows.${rowIndex}.completionTokens`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={rowFields.length === 1}
                  onClick={() => removeRow(rowIndex)}
                  aria-label="Remove row"
                >
                  <LuTrash2 className="size-4" />
                </Button>
              </div>
            </Field>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => appendRow(emptyUsageRow())}
      >
        <LuPlus className="size-4 me-1.5" /> Add row
      </Button>
    </div>
  );
}

/**
 * Hypothetical cost for arbitrary token counts against whatever pricing is
 * currently on file — not tied to any tenant's real usage. Grouped by model:
 * pick a provider+model once per card, then stack as many token-count rows
 * under it as needed (e.g. several separate calls) — they're summed together
 * for that model rather than asking for the model again on every row.
 */
export function AiCostCalculatorDialog({
  open,
  onOpenChange,
  availableModels,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableModels: AiModelPricing[];
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { groups: [emptyGroup()] },
  });
  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({ control: form.control, name: 'groups' });
  const calculateMutation = useCalculateHypotheticalCost();

  const submit = form.handleSubmit(values => {
    calculateMutation.mutate(toCalculateItems(values.groups));
  });

  const results: ModelCostBreakdown[] = calculateMutation.data ?? [];
  const totalUsdCost = results.reduce((sum, r) => sum + (r.usdCost ?? 0), 0);

  const reset = () => {
    form.reset({ groups: [emptyGroup()] });
    calculateMutation.reset();
  };

  return (
    <Modal
      open={open}
      onOpenChange={next => {
        onOpenChange(next);
        if (!next) reset();
      }}
      title="AI cost calculator"
      size="lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendGroup(emptyGroup())}
          >
            <LuPlus className="size-4 me-1.5" /> Add model
          </Button>
          <Button
            type="submit"
            form="ai-cost-calculator-form"
            disabled={calculateMutation.isPending}
          >
            {calculateMutation.isPending && (
              <LuLoaderCircle className="size-4 me-1.5 animate-spin" />
            )}
            {calculateMutation.isPending ? 'Calculating…' : 'Calculate'}
          </Button>
        </>
      }
    >
      <form id="ai-cost-calculator-form" onSubmit={submit} noValidate className="space-y-4">
        <p className="text-sm text-default-500">
          Pick a provider and model, then add token-count rows under it — multiple rows for the same
          model are summed together. This doesn't look at any tenant's real usage.
        </p>

        <div className="max-h-[45vh] space-y-4 overflow-y-auto pe-1">
          {groupFields.map((groupField, groupIndex) => (
            <ModelGroupCard
              key={groupField.id}
              control={form.control}
              groupIndex={groupIndex}
              setValue={form.setValue}
              errors={form.formState.errors}
              availableModels={availableModels}
              canRemoveGroup={groupFields.length > 1}
              onRemoveGroup={() => removeGroup(groupIndex)}
            />
          ))}
        </div>

        {results.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-default-200">
            <table className="min-w-full divide-y divide-default-200">
              <thead className="bg-default-150">
                <tr className="text-sm font-normal text-default-700">
                  <th className="px-3.5 py-2.5 text-start">Model</th>
                  <th className="px-3.5 py-2.5 text-start">Total tokens</th>
                  <th className="px-3.5 py-2.5 text-start">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-200">
                {results.map((result, index) => (
                  <tr key={`${result.model}-${index}`} className="text-sm text-default-800">
                    <td className="px-3.5 py-2.5">
                      {result.provider} / {result.model}
                    </td>
                    <td className="px-3.5 py-2.5 tabular-nums">
                      {result.totalTokens.toLocaleString()}
                    </td>
                    <td className="px-3.5 py-2.5 tabular-nums">
                      {result.usdCost === null ? (
                        <span className="text-default-400">No price entered</span>
                      ) : (
                        `$${result.usdCost.toFixed(4)}`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="text-sm font-medium text-default-900">
                  <td className="px-3.5 py-2.5" colSpan={2}>
                    Total
                  </td>
                  <td className="px-3.5 py-2.5 tabular-nums">${totalUsdCost.toFixed(4)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </form>
    </Modal>
  );
}
