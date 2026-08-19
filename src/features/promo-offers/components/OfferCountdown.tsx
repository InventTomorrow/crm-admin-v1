import { useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';

/** One shared 1Hz tick — every countdown in the chrome re-renders together. */
function subscribeToSecondTick(onTick: () => void): () => void {
  const intervalId = setInterval(onTick, 1000);
  return () => clearInterval(intervalId);
}

/** Whole seconds, so the snapshot only changes once per tick. */
const getCurrentSecond = () => Math.floor(Date.now() / 1000);

const pad = (value: number) => String(value).padStart(2, '0');

interface OfferCountdownProps {
  endsAt: string;
  className?: string;
}

/**
 * Live time left on a campaign. Colour comes from the parent, so the same
 * component works in the topbar chip and on the campaign strip.
 */
export function OfferCountdown({ endsAt, className }: OfferCountdownProps) {
  const currentSecond = useSyncExternalStore(subscribeToSecondTick, getCurrentSecond);
  const remainingMs = Math.max(0, new Date(endsAt).getTime() - currentSecond * 1000);

  if (remainingMs <= 0) return null;

  const days = Math.floor(remainingMs / 86_400_000);
  const hours = Math.floor(remainingMs / 3_600_000) % 24;
  const minutes = Math.floor(remainingMs / 60_000) % 60;
  const seconds = Math.floor(remainingMs / 1000) % 60;

  return (
    <span className={cn('font-mono text-sm font-semibold tabular-nums', className)}>
      {days > 0 && `${days}d `}
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
}
