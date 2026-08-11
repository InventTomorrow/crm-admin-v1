import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { INVALID_FIELD_CLASS } from './input';

export interface TextareaProps extends ComponentProps<'textarea'> {
  invalid?: boolean;
}

export function Textarea({ invalid, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn('form-input w-full', invalid && INVALID_FIELD_CLASS, className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
