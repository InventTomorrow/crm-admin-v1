import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const INVALID_FIELD_CLASS =
  'border-danger/60 focus-visible:border-danger/60 focus-visible:ring-danger/15';

export interface InputProps extends ComponentProps<'input'> {
  invalid?: boolean;
}

export function Input({ invalid, className, ...props }: InputProps) {
  return (
    <input
      className={cn('form-input w-full', invalid && INVALID_FIELD_CLASS, className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
