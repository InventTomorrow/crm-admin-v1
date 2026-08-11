import { DateRangePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import { rangeFromPreset, type DateRange, type Preset } from '../dashboard.hooks';

const PRESETS: { key: Preset; label: string; days: number }[] = [
  { key: '3d', label: '3D', days: 3 },
  { key: '7d', label: '7D', days: 7 },
  { key: '1m', label: '1M', days: 30 },
  { key: '1y', label: '1Y', days: 365 },
];

export function DateRangeFilter({
  preset,
  value,
  onChange,
}: {
  preset: Preset;
  value: DateRange;
  onChange: (range: DateRange, preset: Preset) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-default-200 bg-card p-1">
      {PRESETS.map(presetOption => (
        <button
          key={presetOption.key}
          type="button"
          className={cn(
            'btn btn-sm px-2.5',
            preset === presetOption.key
              ? 'bg-primary text-white'
              : 'bg-transparent text-default-600 hover:bg-default-150'
          )}
          onClick={() => onChange(rangeFromPreset(presetOption.days), presetOption.key)}
        >
          {presetOption.label}
        </button>
      ))}
      <DateRangePicker
        className="w-52"
        placeholder="Custom range"
        value={preset === 'custom' ? [new Date(value.from), new Date(value.to)] : null}
        onChange={range => {
          if (!range) return;
          const [start, end] = range;
          const from = new Date(start);
          from.setHours(0, 0, 0, 0);
          const to = new Date(end);
          to.setHours(23, 59, 59, 999);
          onChange({ from: from.toISOString(), to: to.toISOString() }, 'custom');
        }}
      />
    </div>
  );
}
