import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { IconType } from 'react-icons/lib';
import { LuCircleCheck, LuInfo, LuTrash2, LuTriangleAlert } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from './button';

/** What the confirmed action does — drives icon, accent, button and default copy. */
export type ConfirmIntent = 'danger' | 'warning' | 'success' | 'info';

const INTENT_PRESET: Record<
  ConfirmIntent,
  {
    icon: IconType;
    accentClass: string;
    buttonVariant: ButtonProps['variant'];
    confirmLabel: string;
    description?: string;
  }
> = {
  danger: {
    icon: LuTrash2,
    accentClass: 'bg-danger/10 text-danger',
    buttonVariant: 'destructive',
    confirmLabel: 'Delete',
    description: 'This action cannot be undone.',
  },
  warning: {
    icon: LuTriangleAlert,
    accentClass: 'bg-warning/15 text-warning',
    buttonVariant: 'warning',
    confirmLabel: 'Continue',
  },
  success: {
    icon: LuCircleCheck,
    accentClass: 'bg-success/10 text-success',
    buttonVariant: 'success',
    confirmLabel: 'Confirm',
  },
  info: {
    icon: LuInfo,
    accentClass: 'bg-info/10 text-info',
    buttonVariant: 'default',
    confirmLabel: 'Confirm',
  },
};

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Defaults to `danger` — the only intent that warns the action is permanent. */
  intent?: ConfirmIntent;
  /** Overrides the intent's icon when an action has a clearer symbol of its own. */
  icon?: IconType;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

/** Animated confirmation dialog — icon, spring-in panel, side-by-side actions. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  intent = 'danger',
  icon,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  const preset = INTENT_PRESET[intent];
  const Icon = icon ?? preset.icon;
  const bodyText = description ?? preset.description;

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('overflow-hidden');
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onOpenChange(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.classList.remove('overflow-hidden');
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onOpenChange, isLoading]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-80 flex items-center justify-center overflow-y-auto p-4"
          role="alertdialog"
          aria-modal="true"
        >
          <motion.div
            className="absolute inset-0 bg-default-900/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => !isLoading && onOpenChange(false)}
          />

          <motion.div
            className="card relative w-full max-w-sm rounded-xl border border-default-200 shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          >
            <div className="card-body pt-8 text-center">
              <motion.span
                className={cn(
                  'mx-auto flex size-14 items-center justify-center rounded-full',
                  preset.accentClass
                )}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.05 }}
              >
                <Icon className="size-6" />
              </motion.span>

              <h3 className="mt-4 text-lg font-semibold text-default-900">{title}</h3>
              {bodyText && <p className="mt-1.5 text-sm text-default-500">{bodyText}</p>}

              <div className="mt-6 grid grid-cols-2 gap-2.5">
                <Button
                  variant="ghost"
                  className="border border-default-200"
                  disabled={isLoading}
                  onClick={() => onOpenChange(false)}
                >
                  {cancelLabel}
                </Button>
                <Button variant={preset.buttonVariant} loading={isLoading} onClick={onConfirm}>
                  {isLoading ? 'Please wait…' : (confirmLabel ?? preset.confirmLabel)}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
