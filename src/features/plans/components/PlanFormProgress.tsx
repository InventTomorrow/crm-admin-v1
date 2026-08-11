import { useWatch, type Control } from 'react-hook-form';
import { LuCheck } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import type { PlanFormValues } from '../plan-form.schema';
import { getPlanFormProgress, type PlanFormProgressValues } from '../plan-form.progress';

const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Read-only rail: overall fill ring + per-section state. Not navigation — nothing here is clickable. */
export function PlanFormProgress({ control }: { control: Control<PlanFormValues> }) {
  const values = useWatch({ control }) as PlanFormProgressValues;
  const { sections, filledCount, requiredCount, percentage } = getPlanFormProgress(values);

  return (
    <div className="card sticky top-24">
      <div className="card-body">
        <div className="flex flex-col items-center">
          <div className="relative size-16">
            <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={RING_RADIUS}
                strokeWidth="6"
                className="fill-none stroke-default-200"
              />
              <circle
                cx="32"
                cy="32"
                r={RING_RADIUS}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - percentage / 100)}
                className="fill-none stroke-primary transition-[stroke-dashoffset] duration-300"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-default-900">
              {percentage}%
            </span>
          </div>
          <p className="mt-2 text-xs text-default-500">
            {filledCount} of {requiredCount} required
          </p>
        </div>

        <ul className="mt-5 space-y-3">
          {sections.map(section => (
            <li key={section.id} className="flex items-center gap-2.5">
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                  section.isOptional && 'border-default-200 bg-default-150 text-default-400',
                  !section.isOptional &&
                    (section.isComplete
                      ? 'border-primary bg-primary text-white'
                      : 'border-default-300 text-transparent')
                )}
              >
                <LuCheck className="size-3" />
              </span>
              <span
                className={cn(
                  'truncate text-sm transition-colors',
                  section.isComplete && !section.isOptional
                    ? 'font-medium text-primary'
                    : 'text-default-500'
                )}
              >
                {section.title}
              </span>
              {section.isOptional ? (
                <span className="ms-auto shrink-0 text-xs text-default-400">Optional</span>
              ) : (
                !section.isComplete && (
                  <span className="ms-auto shrink-0 text-xs text-default-400">
                    {section.filledCount}/{section.requiredCount}
                  </span>
                )
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
