import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
 * unmounts on close, so forms inside reset naturally.
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
  // Mount while animating out so the close transition is visible.
  const [visible, setVisible] = useState(open);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      const raf = requestAnimationFrame(() => setAnimateIn(true));
      return () => cancelAnimationFrame(raf);
    }
    setAnimateIn(false);
    const timeout = setTimeout(() => setVisible(false), 200);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!visible) return;
    document.body.classList.add('overflow-hidden');
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.classList.remove('overflow-hidden');
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onOpenChange]);

  if (!visible) return null;

  return createPortal(
    <div
      className="fixed top-0 start-0 z-80 size-full overflow-x-hidden overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'fixed inset-0 bg-default-900/50 transition-opacity duration-200',
          animateIn ? 'opacity-100' : 'opacity-0'
        )}
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          'relative m-3 mx-auto flex min-h-[calc(100%-56px)] w-full items-center transition-all duration-200 ease-in-out',
          SIZE_CLASS[size],
          animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
      >
        <div className="card pointer-events-auto flex w-full flex-col rounded-xl border border-default-200 shadow-2xs">
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
        </div>
      </div>
    </div>,
    document.body
  );
}
