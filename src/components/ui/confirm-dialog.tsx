import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LuTriangleAlert } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  isLoading?: boolean;
}

/** Animated confirmation dialog — icon, spring-in panel, side-by-side actions. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
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
                  destructive ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'
                )}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.05 }}
              >
                <LuTriangleAlert className="size-6" />
              </motion.span>

              <h3 className="mt-4 text-lg font-semibold text-default-900">{title}</h3>
              <p className="mt-1.5 text-sm text-default-500">
                {description ?? 'This action cannot be undone.'}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2.5">
                <Button
                  variant="ghost"
                  className="border border-default-200"
                  disabled={isLoading}
                  onClick={() => onOpenChange(false)}
                >
                  {cancelLabel}
                </Button>
                <Button
                  variant={destructive ? 'destructive' : 'default'}
                  loading={isLoading}
                  onClick={onConfirm}
                >
                  {isLoading ? 'Please wait…' : confirmLabel}
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
