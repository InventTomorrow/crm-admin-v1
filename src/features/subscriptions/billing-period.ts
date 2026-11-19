const DAY_IN_MS = 86_400_000;

export interface BillingPeriodProgress {
  /** 0 to 100, clamped. */
  elapsedPercent: number;
  /** Negative once the period has ended. */
  daysLeft: number;
}

export function getBillingPeriodProgress(
  periodStart: string | null,
  periodEnd: string | null,
  now: Date = new Date()
): BillingPeriodProgress | null {
  if (!periodEnd) return null;
  const endTime = new Date(periodEnd).getTime();
  const startTime = periodStart ? new Date(periodStart).getTime() : endTime;
  const totalSpan = Math.max(endTime - startTime, 1);
  const elapsedRatio = (now.getTime() - startTime) / totalSpan;
  return {
    elapsedPercent: Math.round(Math.min(Math.max(elapsedRatio, 0), 1) * 100),
    daysLeft: Math.ceil((endTime - now.getTime()) / DAY_IN_MS),
  };
}
