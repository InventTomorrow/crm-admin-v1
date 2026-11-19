import { LuCheck } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import type { AffiliateFormStep } from './affiliate-form-steps';

interface FormStepIndicatorProps {
  steps: AffiliateFormStep[];
  activeStepIndex: number;
  onStepSelect: (stepIndex: number) => void;
  /** Editing starts from a valid record, so any step can be opened directly. */
  canJumpToAnyStep?: boolean;
}

/** While creating, later steps open only through Next, which validates; editing can jump anywhere. */
export function FormStepIndicator({
  steps,
  activeStepIndex,
  onStepSelect,
  canJumpToAnyStep = false,
}: FormStepIndicatorProps) {
  return (
    <ol className="mb-5 flex items-start gap-2">
      {steps.map((step, stepIndex) => {
        const isDone = stepIndex < activeStepIndex;
        const isActive = stepIndex === activeStepIndex;
        return (
          <li key={step.title} className="flex flex-1 items-start gap-2">
            <button
              type="button"
              disabled={isActive || (!isDone && !canJumpToAnyStep)}
              onClick={() => onStepSelect(stepIndex)}
              className="flex min-w-0 items-start gap-2 text-start disabled:cursor-default"
              aria-current={isActive ? 'step' : undefined}
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  isActive && 'border-primary bg-primary text-white',
                  isDone && 'border-primary bg-primary/10 text-primary',
                  !isActive && !isDone && 'border-default-300 text-default-500'
                )}
              >
                {isDone ? <LuCheck className="size-3.5" /> : stepIndex + 1}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    'block truncate text-sm font-medium',
                    isActive ? 'text-default-900' : 'text-default-500'
                  )}
                >
                  {step.title}
                </span>
                <span className="hidden truncate text-xs text-default-400 sm:block">
                  {step.description}
                </span>
              </span>
            </button>
            {stepIndex < steps.length - 1 && (
              <span className="mt-3.5 hidden h-px flex-1 bg-default-200 sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
