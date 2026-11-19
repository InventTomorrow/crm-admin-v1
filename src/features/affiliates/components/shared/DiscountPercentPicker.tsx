import { cn } from '@/lib/utils';
import { MAX_REFERRAL_DISCOUNT_PERCENT, MIN_REFERRAL_DISCOUNT_PERCENT } from '../../types';

const QUICK_PICKS = [5, 10, 15];

interface DiscountPercentPickerProps {
  value: number;
  onChange: (discountPercent: number) => void;
  invalid?: boolean;
}

/** Slider capped at the programme's 15% ceiling, with one-tap common values. */
export function DiscountPercentPicker({ value, onChange, invalid }: DiscountPercentPickerProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        invalid ? 'border-danger' : 'border-default-200 bg-default-150/40'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-2xl font-semibold tabular-nums text-primary">{value}% off</span>
        <div className="flex gap-1.5">
          {QUICK_PICKS.map(quickPick => (
            <button
              key={quickPick}
              type="button"
              onClick={() => onChange(quickPick)}
              className={cn(
                'btn btn-sm px-2.5',
                value === quickPick
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-default-600 hover:bg-default-150'
              )}
            >
              {quickPick}%
            </button>
          ))}
        </div>
      </div>
      <input
        type="range"
        min={MIN_REFERRAL_DISCOUNT_PERCENT}
        max={MAX_REFERRAL_DISCOUNT_PERCENT}
        step={1}
        value={value}
        onChange={event => onChange(event.target.valueAsNumber)}
        className="mt-3 w-full accent-primary"
        aria-label="Discount percentage"
      />
      <div className="mt-1 flex justify-between text-xs text-default-400">
        <span>{MIN_REFERRAL_DISCOUNT_PERCENT}%</span>
        <span>{MAX_REFERRAL_DISCOUNT_PERCENT}% max</span>
      </div>
    </div>
  );
}
