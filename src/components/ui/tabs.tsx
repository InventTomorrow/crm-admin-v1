import { cn } from '@/lib/utils';

export interface TabItem {
  key: string;
  label: string;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

/** React-state tab strip — content is conditionally rendered by the caller. */
export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-default-200" role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          className={cn(
            '-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors',
            active === tab.key
              ? 'border-primary text-primary'
              : 'border-transparent text-default-500 hover:text-default-800'
          )}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
          {tab.badge !== undefined && (
            <span className="ms-1.5 rounded bg-default-150 px-1.5 py-0.5 text-xs text-default-600">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
