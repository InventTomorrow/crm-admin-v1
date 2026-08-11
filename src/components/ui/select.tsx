import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { INVALID_FIELD_CLASS } from './input';

export interface SelectProps extends ComponentProps<'select'> {
  invalid?: boolean;
}

/** Native select styled as a Tailwick input. */
export function Select({ invalid, className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn('form-input w-full', invalid && INVALID_FIELD_CLASS, className)}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  );
}
