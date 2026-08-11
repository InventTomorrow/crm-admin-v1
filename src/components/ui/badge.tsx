import type { IconType } from 'react-icons/lib';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

const TONE_CLASS: Record<BadgeTone, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
  neutral: 'bg-default-200 text-default-600',
  primary: 'bg-primary/10 text-primary',
};

interface BadgeProps {
  tone: BadgeTone;
  icon?: IconType;
  children: ReactNode;
  className?: string;
}

/** Tailwick pill badge. */
export function Badge({ tone, icon: Icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-x-1 rounded-md px-2.5 py-0.5 text-xs font-medium',
        TONE_CLASS[tone],
        className
      )}
    >
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  );
}
