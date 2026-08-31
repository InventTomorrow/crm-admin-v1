import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LuX } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const SIZE_CLASS = {
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-3xl',
} as const;

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  /** Small line under the title. */
  description?: ReactNode;
  size?: keyof typeof SIZE_CLASS;
  footer?: ReactNode;
  children: ReactNode;
}

/** Right-hand slide-over panel (framer-motion) for record details. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  footer,
  children,
}: SheetProps) {
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

  const slideFrom = document.documentElement.dir === 'rtl' ? '-100%' : '100%';

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-80" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-default-900/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            className={cn(
              'absolute inset-y-0 end-0 flex w-full flex-col bg-card shadow-2xl',
              SIZE_CLASS[size]
            )}
            initial={{ x: slideFrom }}
            animate={{ x: 0 }}
            exit={{ x: slideFrom }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-default-200 px-5 py-4">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-default-800">{title}</h3>
                {description && <p className="mt-0.5 text-sm text-default-500">{description}</p>}
              </div>
              <button
                type="button"
                aria-label="Close"
                className="btn size-7.5 shrink-0 bg-default-100 text-default-500 hover:bg-default-200"
                onClick={() => onOpenChange(false)}
              >
                <LuX className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

            {footer && (
              <div className="flex justify-end gap-2 border-t border-default-200 px-5 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
