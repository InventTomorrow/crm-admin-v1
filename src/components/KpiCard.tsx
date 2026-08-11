import type { IconType } from 'react-icons/lib';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: number | string | undefined;
  sub?: string;
  icon: IconType;
  variant?: 'default' | 'brand';
  isLoading?: boolean;
}

/** Tailwick stat tile (orders-dashboard style). `brand` renders on solid primary. */
export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  variant = 'default',
  isLoading = false,
}: KpiCardProps) {
  const isBrand = variant === 'brand';
  return (
    <div className={cn('card', isBrand && 'bg-primary border-primary')}>
      <div className="card-body">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'btn size-12 shrink-0',
              isBrand ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
            )}
          >
            <Icon className="size-6" />
          </div>
          <div className="min-w-0">
            {isLoading ? (
              <>
                <div
                  className={cn(
                    'mb-2 h-5 w-20 animate-pulse rounded',
                    isBrand ? 'bg-white/30' : 'bg-default-200'
                  )}
                />
                <div
                  className={cn(
                    'h-3.5 w-24 animate-pulse rounded',
                    isBrand ? 'bg-white/20' : 'bg-default-150'
                  )}
                />
              </>
            ) : (
              <>
                <h5
                  className={cn(
                    'mb-1 truncate text-base font-semibold',
                    isBrand ? 'text-white' : 'text-default-800'
                  )}
                >
                  {value ?? '—'}
                </h5>
                <p
                  className={cn('truncate text-sm', isBrand ? 'text-white/75' : 'text-default-500')}
                >
                  {label}
                </p>
                {sub && (
                  <p
                    className={cn(
                      'mt-0.5 truncate text-xs',
                      isBrand ? 'text-white/60' : 'text-default-400'
                    )}
                  >
                    {sub}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
