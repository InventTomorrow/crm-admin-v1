import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuChevronsUpDown, LuLoaderCircle, LuPlus, LuX } from 'react-icons/lu';

export interface SearchSelectOption {
  id: string;
  label: string;
  sub?: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  value: SearchSelectOption | null;
  onSelect: (option: SearchSelectOption | null) => void;
  query: string;
  onQueryChange: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  invalid?: boolean;
  /** Show a clear (×) affordance when a value is selected. */
  clearable?: boolean;
  /**
   * When provided, typing a query with no exact (case-insensitive) label match
   * appends a "Create "<query>"" row; selecting it calls this instead of onSelect.
   */
  onCreate?: (query: string) => void;
  createLabel?: (query: string) => string;
}

/**
 * Server-search combobox (Tailwick-styled). Dumb about fetching — the caller
 * owns the debounced query and passes results via `options`.
 *
 * The dropdown panel is portaled to <body> and positioned against the trigger's
 * own rect (not CSS-anchored) — a plain `position: absolute` panel gets clipped
 * (and jerks on open, from the browser scrolling the clipped input into view)
 * when this sits inside a scrollable ancestor, e.g. a long form in a modal.
 */
export function SearchSelect({
  options,
  value,
  onSelect,
  query,
  onQueryChange,
  isLoading = false,
  placeholder = 'Search…',
  disabled = false,
  emptyMessage = 'No matches found.',
  invalid,
  clearable = false,
  onCreate,
  createLabel = q => `Create "${q}"`,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [panelRect, setPanelRect] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const trimmedQuery = query.trim();
  const hasExactMatch = options.some(
    option => option.label.toLowerCase() === trimmedQuery.toLowerCase()
  );
  const showCreateRow = !!onCreate && trimmedQuery.length > 0 && !hasExactMatch;
  const rowCount = options.length + (showCreateRow ? 1 : 0);

  const updatePanelRect = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPanelRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  };

  useEffect(() => {
    if (!open) return;
    updatePanelRect();
    searchInputRef.current?.focus();

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    // capture:true so a scroll on ANY ancestor (not just window) re-anchors the panel.
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', updatePanelRect, true);
    window.addEventListener('resize', updatePanelRect);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', updatePanelRect, true);
      window.removeEventListener('resize', updatePanelRect);
    };
  }, [open]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [options, showCreateRow]);

  const selectOption = (option: SearchSelectOption) => {
    onSelect(option);
    setOpen(false);
  };

  const selectCreate = () => {
    onCreate?.(trimmedQuery);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, rowCount - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (highlightedIndex < options.length) {
        const highlighted = options[highlightedIndex];
        if (highlighted) selectOption(highlighted);
      } else if (showCreateRow) {
        selectCreate();
      }
    }
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'form-input flex w-full items-center justify-between gap-2 text-start',
          disabled && 'cursor-not-allowed opacity-60',
          invalid && 'border-danger focus:border-danger focus:ring-danger/20'
        )}
        onClick={() => setOpen(prev => !prev)}
      >
        <span className={cn('truncate', !value && 'text-default-400')}>
          {value ? value.label : placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {clearable && value && (
            <LuX
              className="size-4 text-default-400 hover:text-danger"
              role="button"
              aria-label="Clear selection"
              onClick={event => {
                event.stopPropagation();
                onSelect(null);
              }}
            />
          )}
          <LuChevronsUpDown className="size-4 text-default-400" />
        </span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && panelRect && (
            <motion.div
              ref={panelRef}
              className="fixed z-100 rounded-lg border border-default-200 bg-card p-2 shadow-lg"
              style={{ top: panelRect.top, left: panelRect.left, width: panelRect.width }}
              initial={{ opacity: 0, scale: 0.97, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -4 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
            >
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={event => onQueryChange(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type to search…"
                className="form-input form-input-sm mb-2 w-full"
              />
              <ul role="listbox" className="max-h-56 overflow-y-auto">
                {isLoading ? (
                  <li className="flex items-center gap-2 px-3 py-2 text-sm text-default-500">
                    <LuLoaderCircle className="size-4 animate-spin" /> Searching…
                  </li>
                ) : options.length === 0 && !showCreateRow ? (
                  <li className="px-3 py-2 text-sm text-default-500">{emptyMessage}</li>
                ) : (
                  <>
                    {options.map((option, optionIndex) => (
                      <li
                        key={option.id}
                        role="option"
                        aria-selected={value?.id === option.id}
                        className={cn(
                          'cursor-pointer rounded px-3 py-1.5',
                          optionIndex === highlightedIndex && 'bg-default-150',
                          value?.id === option.id && 'bg-primary/10'
                        )}
                        onMouseEnter={() => setHighlightedIndex(optionIndex)}
                        onClick={() => selectOption(option)}
                      >
                        <span className="block truncate text-sm text-default-800">
                          {option.label}
                        </span>
                        {option.sub && (
                          <span className="block truncate text-xs text-default-500">
                            {option.sub}
                          </span>
                        )}
                      </li>
                    ))}
                    {showCreateRow && (
                      <li
                        role="option"
                        aria-selected={false}
                        className={cn(
                          'flex cursor-pointer items-center gap-1.5 rounded px-3 py-1.5 text-primary',
                          options.length === highlightedIndex && 'bg-default-150'
                        )}
                        onMouseEnter={() => setHighlightedIndex(options.length)}
                        onClick={selectCreate}
                      >
                        <LuPlus className="size-3.5 shrink-0" />
                        <span className="truncate text-sm">{createLabel(trimmedQuery)}</span>
                      </li>
                    )}
                  </>
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
