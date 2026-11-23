import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LuChevronDown } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DisclosureSectionProps {
  title: string;
  /** One line describing the hidden values, so the section is useful while closed. */
  summary: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  toggleLabel: string;
  /** Extra header control, shown next to the toggle. */
  action?: ReactNode;
  children: ReactNode;
}

/** Settings that are rarely changed: a summary line, with the fields sliding open on demand. */
export function DisclosureSection({
  title,
  summary,
  isOpen,
  onToggle,
  toggleLabel,
  action,
  children,
}: DisclosureSectionProps) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-default-900">{title}</h4>
          <p className="mt-1 text-sm text-default-500">{summary}</p>
        </div>
        <div className="flex items-center gap-2">
          {action}
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={isOpen}
            onClick={onToggle}
          >
            {isOpen ? 'Hide' : toggleLabel}
            <LuChevronDown
              className={cn(
                'size-4 ms-1 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </Button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="disclosure-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pt-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
