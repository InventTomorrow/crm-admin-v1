import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Checkbox({ className, ...props }: ComponentProps<'input'>) {
  return <input type="checkbox" className={cn('form-checkbox', className)} {...props} />;
}
