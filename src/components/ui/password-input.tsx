import { useState, type ComponentProps } from 'react';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { INVALID_FIELD_CLASS } from './input';

export interface PasswordInputProps extends ComponentProps<'input'> {
  invalid?: boolean;
}

/** Text input with a show/hide password toggle. */
export function PasswordInput({ invalid, className, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        className={cn('form-input w-full pe-10', invalid && INVALID_FIELD_CLASS, className)}
        aria-invalid={invalid || undefined}
        {...props}
      />
      <button
        type="button"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 end-0 flex items-center pe-3 text-default-500 hover:text-default-800"
        onClick={() => setShowPassword(prev => !prev)}
      >
        {showPassword ? <LuEyeOff className="size-4" /> : <LuEye className="size-4" />}
      </button>
    </div>
  );
}
