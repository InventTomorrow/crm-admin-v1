import { useState } from 'react';
import { Tabs } from '@/components/ui/tabs';
import { getPlanFormProgress, type PlanFormProgressValues } from '../plan-form.progress';
import type { PlanFormValues } from '../plan-form.schema';
import { PlanPreviewCard, type PreviewSurface } from './PlanPreviewCard';

/**
 * The form's right rail. Shows the plan as customers will see it, redrawn on
 * every keystroke — a section checklist only repeats the labels already on
 * screen, whereas the card answers the question the admin actually has.
 *
 * Completion is kept as a single line so the rail stays mostly preview.
 */
export function PlanLivePreview({ values }: { values: PlanFormValues }) {
  const [surface, setSurface] = useState<PreviewSurface>('landing');
  const { filledCount, requiredCount, percentage } = getPlanFormProgress(
    values as PlanFormProgressValues
  );
  const complete = filledCount >= requiredCount;

  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-default-800">Live preview</h3>
          <span className={complete ? 'text-xs text-primary' : 'text-xs text-default-500'}>
            {filledCount} of {requiredCount} required
          </span>
        </div>

        <div className="mb-4 h-1 overflow-hidden rounded-full bg-default-200">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <Tabs
          tabs={[
            { key: 'landing', label: 'Landing page' },
            { key: 'app', label: 'In-app' },
          ]}
          active={surface}
          onChange={key => setSurface(key as PreviewSurface)}
        />

        <div className="mt-4">
          <PlanPreviewCard values={values} surface={surface} />
        </div>

        <p className="mt-3 text-xs text-default-400">
          {surface === 'landing'
            ? 'Public pricing section. Driven by the tagline, feature bullets, button label and offer price.'
            : 'The plan grid in Settings → Billing, where customers subscribe.'}
        </p>

        {!values.isPublic && (
          <p className="mt-2 text-xs text-warning">
            Not public — this plan won’t be listed on either surface.
          </p>
        )}
      </div>
    </div>
  );
}
