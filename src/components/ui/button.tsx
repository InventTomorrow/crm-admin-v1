import { cva, type VariantProps } from 'class-variance-authority';
import { LuLoaderCircle } from 'react-icons/lu';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'btn transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90',
        destructive: 'bg-danger text-white hover:bg-danger/90',
        success: 'bg-success text-white hover:bg-success/90',
        warning: 'bg-warning text-white hover:bg-warning/90',
        outline:
          'border border-default-200 bg-transparent text-default-600 hover:border-primary/10 hover:bg-primary/10 hover:text-primary',
        'outline-danger':
          'border border-default-200 bg-transparent text-default-600 hover:border-danger/10 hover:bg-danger/10 hover:text-danger',
        ghost: 'bg-transparent text-default-600 hover:bg-default-150',
        soft: 'bg-default-100 text-default-500 hover:bg-default-200',
        'soft-danger': 'bg-danger/10 text-danger hover:bg-danger hover:text-white',
        'dashed-primary':
          'border border-dashed border-primary bg-transparent text-primary hover:bg-primary/10',
      },
      size: {
        default: '',
        sm: 'btn-sm',
        icon: 'size-9',
        'icon-sm': 'size-7.5',
        'icon-xs': 'size-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  /** Shows a spinner and disables the button. */
  loading?: boolean;
}

/** App button — variants over Tailwick's `.btn` base. Use `buttonVariants()` for Links. */
export function Button({
  className,
  variant,
  size,
  loading = false,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LuLoaderCircle className="size-4 me-1.5 animate-spin" />}
      {children}
    </button>
  );
}
