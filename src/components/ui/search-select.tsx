import { useEffect, useRef, useState } from 'react';
import { LuChevronsUpDown, LuLoaderCircle, LuX } from 'react-icons/lu';
import { cn } from '@/lib/utils';

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
}

/**
 * Server-search combobox (Tailwick-styled). Dumb about fetching — the caller
 * owns the debounced query and passes results via `options`.
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
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    searchInputRef.current?.focus();
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [options]);

  const selectOption = (option: SearchSelectOption) => {
    onSelect(option);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const highlighted = options[highlightedIndex];
      if (highlighted) selectOption(highlighted);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
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

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-default-200 bg-card p-2 shadow-lg">
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
            ) : options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-default-500">{emptyMessage}</li>
            ) : (
              options.map((option, optionIndex) => (
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
                  <span className="block truncate text-sm text-default-800">{option.label}</span>
                  {option.sub && (
                    <span className="block truncate text-xs text-default-500">{option.sub}</span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
