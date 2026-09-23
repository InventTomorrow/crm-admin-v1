import {
  createContext,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { IconType } from 'react-icons/lib';
import { cn } from '@/lib/utils';

interface DropdownContextValue {
  close: () => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

const MENU_OFFSET = 4;
const VIEWPORT_MARGIN = 8;

interface MenuPosition {
  top: number;
  left: number;
}

function getMenuPosition(
  trigger: HTMLElement,
  menu: HTMLElement,
  align: 'start' | 'end'
): MenuPosition {
  const triggerRect = trigger.getBoundingClientRect();
  // offset* sizes ignore the open animation's scale transform.
  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;
  const isRtl = getComputedStyle(trigger).direction === 'rtl';
  const alignsToRightEdge = (align === 'end') !== isRtl;

  const preferredLeft = alignsToRightEdge ? triggerRect.right - menuWidth : triggerRect.left;
  const maxLeft = window.innerWidth - menuWidth - VIEWPORT_MARGIN;
  const left = Math.max(VIEWPORT_MARGIN, Math.min(preferredLeft, maxLeft));

  const spaceBelow = window.innerHeight - triggerRect.bottom;
  const fitsBelow = spaceBelow >= menuHeight + MENU_OFFSET + VIEWPORT_MARGIN;
  const opensUpward = !fitsBelow && triggerRect.top > spaceBelow;
  const top = opensUpward
    ? triggerRect.top - menuHeight - MENU_OFFSET
    : triggerRect.bottom + MENU_OFFSET;

  return { top, left };
}

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
 *
 * The menu is portaled to <body> with fixed positioning — an absolute menu gets
 * clipped by scroll containers such as the DataTable's `overflow-x-auto` wrapper.
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
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current || !menuRef.current) return;
    setMenuPosition(getMenuPosition(triggerRef.current, menuRef.current, align));
  }, [align]);

  // Layout effect so the menu is measured and placed before the first paint.
  useLayoutEffect(() => {
    if (open) updateMenuPosition();
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) close();
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    // capture:true so scrolling any ancestor (e.g. the table) re-anchors the menu.
    window.addEventListener('scroll', updateMenuPosition, true);
    window.addEventListener('resize', updateMenuPosition);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [open, close, updateMenuPosition]);

  return (
    <div className="inline-flex">
      <button
        ref={triggerRef}
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

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              role="menu"
              className={cn(
                'fixed z-100 min-w-40 whitespace-nowrap rounded-lg border border-default-200 bg-card p-2 shadow-lg',
                menuClassName
              )}
              style={menuPosition ?? { top: 0, left: 0, visibility: 'hidden' }}
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              onClick={event => event.stopPropagation()}
            >
              <DropdownContext value={{ close }}>{children}</DropdownContext>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
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
