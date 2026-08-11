import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Switch({ className, ...props }: ComponentProps<'input'>) {
  return <input type="checkbox" className={cn('form-switch', className)} {...props} />;
}

/** Bordered row with a label/description on the left and a switch on the right. */
export function ToggleRow({
  label,
  description,
  ...switchProps
}: { label: string; description?: string } & ComponentProps<'input'>) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-default-200 px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-default-800">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-default-500">{description}</span>
        )}
      </span>
      <Switch {...switchProps} />
    </label>
  );
}
