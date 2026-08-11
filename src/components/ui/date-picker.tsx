import Flatpickr from 'react-flatpickr';
import { LuCalendarRange } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const INVALID_CLASS = 'border-danger focus:border-danger focus:ring-danger/20';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Single-date flatpickr styled as a Tailwick input (RHF: wire via Controller). */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  invalid,
  disabled,
  className,
}: DatePickerProps) {
  return (
    <div className={cn('relative', className)}>
      <Flatpickr
        value={value ?? undefined}
        options={{ dateFormat: 'd M, Y' }}
        onChange={dates => onChange(dates[0] ?? null)}
        className={cn('form-input w-full ps-9', invalid && INVALID_CLASS)}
        placeholder={placeholder}
        disabled={disabled}
      />
      <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
        <LuCalendarRange className="size-4 text-default-500" />
      </div>
    </div>
  );
}

interface DateRangePickerProps {
  value: [Date, Date] | null;
  onChange: (range: [Date, Date] | null) => void;
  placeholder?: string;
  className?: string;
}

/** Range flatpickr — fires only when both ends are picked. */
export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range',
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn('relative', className)}>
      <Flatpickr
        value={value ?? undefined}
        options={{ mode: 'range', dateFormat: 'd M, Y' }}
        onChange={dates => {
          if (dates.length === 2) onChange([dates[0], dates[1]]);
          else if (dates.length === 0) onChange(null);
        }}
        className="form-input form-input-sm w-full ps-9"
        placeholder={placeholder}
      />
      <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
        <LuCalendarRange className="size-3.5 text-default-500" />
      </div>
    </div>
  );
}
