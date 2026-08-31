import { useState, type ComponentProps } from 'react';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import { INVALID_FIELD_CLASS } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { maskAccountNumber } from '../mask';

export interface MaskedAccountInputProps extends Omit<ComponentProps<'input'>, 'value'> {
  value: string;
  invalid?: boolean;
  /** What the toggle announces it reveals, e.g. "account number". */
  revealLabel: string;
}

/**
 * Shows asterisks while the field is idle and the real value while it is being
 * edited — typing is impossible without focus, so the mask never gets in the
 * way. The toggle is for reading the value back without focusing the field.
 */
export function MaskedAccountInput({
  value,
  invalid,
  revealLabel,
  className,
  onBlur,
  ...props
}: MaskedAccountInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const isMasked = !isFocused && !isRevealed && value.length > 0;

  return (
    <div className="relative">
      <input
        {...props}
        value={isMasked ? maskAccountNumber(value) : value}
        autoComplete="off"
        className={cn('form-input w-full pe-10', invalid && INVALID_FIELD_CLASS, className)}
        aria-invalid={invalid || undefined}
        onFocus={() => setIsFocused(true)}
        onBlur={event => {
          setIsFocused(false);
          onBlur?.(event);
        }}
      />
      <button
        type="button"
        aria-label={`${isRevealed ? 'Hide' : 'Show'} ${revealLabel}`}
        className="absolute inset-y-0 end-0 flex items-center pe-3 text-default-500 hover:text-default-800"
        onClick={() => setIsRevealed(current => !current)}
      >
        {isRevealed ? <LuEyeOff className="size-4" /> : <LuEye className="size-4" />}
      </button>
    </div>
  );
}
