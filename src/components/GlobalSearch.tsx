import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { LuSearch } from 'react-icons/lu';
import { Modal } from '@/components/ui/modal';
import { menuItemsData } from '@/components/layouts/SideNav/menu';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** ⌘K navigation palette over the sidenav destinations. */
export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const destinations = useMemo(() => menuItemsData.filter(item => !item.isTitle && item.href), []);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return destinations;
    return destinations.filter(item => item.label.toLowerCase().includes(normalized));
  }, [destinations, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlightedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  const goTo = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const highlighted = results[highlightedIndex];
      if (highlighted?.href) goTo(highlighted.href);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Search" size="sm">
      <div className="relative mb-3">
        <input
          type="text"
          autoFocus
          value={query}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Where do you want to go?"
          className="form-input w-full ps-9"
        />
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
          <LuSearch className="size-4 text-default-500" />
        </div>
      </div>

      <ul className="max-h-72 overflow-y-auto">
        {results.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-default-500">No matching pages.</li>
        ) : (
          results.map((item, resultIndex) => {
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-3 rounded px-3 py-2 text-start text-sm text-default-700 hover:bg-default-150',
                    resultIndex === highlightedIndex && 'bg-default-150'
                  )}
                  onMouseEnter={() => setHighlightedIndex(resultIndex)}
                  onClick={() => item.href && goTo(item.href)}
                >
                  {Icon && <Icon className="size-4 text-default-500" />}
                  {item.label}
                </button>
              </li>
            );
          })
        )}
      </ul>

      <p className="mt-3 border-t border-default-200 pt-3 text-xs text-default-400">
        Navigate with <kbd className="rounded bg-default-150 px-1.5 py-0.5">↑</kbd>{' '}
        <kbd className="rounded bg-default-150 px-1.5 py-0.5">↓</kbd> and open with{' '}
        <kbd className="rounded bg-default-150 px-1.5 py-0.5">Enter</kbd>
      </p>
    </Modal>
  );
}
