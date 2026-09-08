import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LuX } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const SIZE_CLASS = {
  sm: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  size?: keyof typeof SIZE_CLASS;
  /** Rendered right-aligned inside a card-footer when provided. */
  footer?: ReactNode;
  hideClose?: boolean;
  children: ReactNode;
}

/**
 * React-controlled dialog styled like Tailwick's hs-overlay modals. Content
 * unmounts on close, so forms inside reset naturally. Same spring-in feel as
 * ConfirmDialog/Sheet — AnimatePresence handles the exit animation itself, so
 * there's no manual "stay mounted while closing" state to get out of sync.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  size = 'sm',
  footer,
  hideClose = false,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    document.body.classList.add('overflow-hidden');
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.classList.remove('overflow-hidden');
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onOpenChange]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed top-0 start-0 z-80 size-full overflow-x-hidden overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            className="fixed inset-0 bg-default-900/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => onOpenChange(false)}
          />
          <div
            className={cn(
              'relative m-3 mx-auto flex min-h-[calc(100%-56px)] w-full items-center',
              SIZE_CLASS[size]
            )}
          >
            <motion.div
              className="card pointer-events-auto flex w-full flex-col rounded-xl border border-default-200 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            >
              {(title || !hideClose) && (
                <div className="card-header flex items-center justify-between">
                  <h3 className="text-base font-semibold text-default-800">{title}</h3>
                  {!hideClose && (
                    <button
                      type="button"
                      aria-label="Close"
                      className="text-default-500 hover:text-default-800"
                      onClick={() => onOpenChange(false)}
                    >
                      <LuX className="size-5" />
                    </button>
                  )}
                </div>
              )}

              <div className="card-body max-h-[75vh] overflow-y-auto">{children}</div>

              {footer && <div className="card-footer flex justify-end gap-2">{footer}</div>}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
