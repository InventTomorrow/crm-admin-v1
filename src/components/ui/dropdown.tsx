import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { IconType } from 'react-icons/lib';
import { cn } from '@/lib/utils';

interface DropdownContextValue {
  close: () => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

interface DropdownProps {
  /** Trigger button content (icon/label). */
  trigger: ReactNode;
  triggerClassName?: string;
  /** Panel alignment relative to the trigger. */
  align?: 'start' | 'end';
  menuClassName?: string;
  /** Accessible label for icon-only triggers. */
  triggerLabel?: string;
  children: ReactNode;
}

/**
 * React-controlled action menu styled like Tailwick's hs-dropdown — used for
 * data-driven rows where Preline's imperative init doesn't fit.
 */
export function Dropdown({
  trigger,
  triggerClassName,
  align = 'end',
  menuClassName,
  triggerLabel,
  children,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) close();
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={triggerLabel}
        className={cn(
          'btn size-7.5 bg-default-200 hover:bg-default-300 text-default-500',
          triggerClassName
        )}
        onClick={event => {
          event.stopPropagation();
          setOpen(prev => !prev);
        }}
      >
        {trigger}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full z-50 mt-1 min-w-40 rounded-lg border border-default-200 bg-card p-2 shadow-lg',
            align === 'end' ? 'end-0' : 'start-0',
            menuClassName
          )}
          onClick={event => event.stopPropagation()}
        >
          <DropdownContext value={{ close }}>{children}</DropdownContext>
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  icon?: IconType;
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
  children: ReactNode;
}

export function DropdownItem({
  icon: Icon,
  destructive = false,
  disabled = false,
  onSelect,
  children,
}: DropdownItemProps) {
  const dropdown = use(DropdownContext);
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-1.5 rounded px-3 py-1.5 text-start text-sm',
        destructive ? 'text-danger hover:bg-danger/10' : 'text-default-500 hover:bg-default-150',
        disabled && 'pointer-events-none opacity-50'
      )}
      onClick={() => {
        dropdown?.close();
        onSelect();
      }}
    >
      {Icon && <Icon className="size-3.5 shrink-0" />}
      {children}
    </button>
  );
}

/** Non-interactive label row (e.g. "Toggle columns"). */
export function DropdownLabel({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-default-200 px-3 pb-1.5 pt-0.5 text-xs font-semibold text-default-600">
      {children}
    </div>
  );
}
