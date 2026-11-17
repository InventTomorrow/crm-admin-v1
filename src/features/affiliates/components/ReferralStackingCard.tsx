import { LuLayers } from 'react-icons/lu';
import { ErrorState, LoadingState } from '@/components/states';
import { SettingsCard } from '@/features/settings/components/SettingsCard';
import { usePermissions } from '@/features/auth/auth.hooks';
import { SystemPermissions } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useReferralStackingMode, useUpdateReferralStackingMode } from '../affiliates.hooks';
import type { ReferralStackingMode } from '../types';

const STACKING_OPTIONS: { mode: ReferralStackingMode; title: string; example: string }[] = [
  {
    mode: 'BEST_OF',
    title: 'Better of the two',
    example: 'Promo 20%, code 10%: customer gets 20%. Never combined.',
  },
  {
    mode: 'STACK',
    title: 'Stack both',
    example: 'Promo 20%, then code 10% on the result: customer pays 72%.',
  },
  {
    mode: 'REFERRAL_OVERRIDES',
    title: 'Referral code wins',
    example: 'Promo 20%, code 10%: customer gets 10%.',
  },
];

/** How a referral discount combines with a running promo offer. */
export function ReferralStackingCard() {
  const { can } = usePermissions();
  const canEdit = can(SystemPermissions.SETTINGS_EDIT);
  const { data: activeMode, isLoading, isError, error, refetch } = useReferralStackingMode();
  const updateModeMutation = useUpdateReferralStackingMode();

  return (
    <SettingsCard
      icon={LuLayers}
      title="Referral and promo discounts"
      description="What a customer pays when a promo offer is running and their account has a referral code."
    >
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="grid gap-3" role="radiogroup">
          {STACKING_OPTIONS.map(option => {
            const isSelected = option.mode === activeMode;
            return (
              <label
                key={option.mode}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-default-200 hover:border-primary/40',
                  !canEdit && 'cursor-not-allowed opacity-70'
                )}
              >
                <input
                  type="radio"
                  name="referral-stacking-mode"
                  className="form-radio mt-0.5"
                  checked={isSelected}
                  disabled={!canEdit || updateModeMutation.isPending}
                  onChange={() => updateModeMutation.mutate(option.mode)}
                />
                <span>
                  <span className="block text-sm font-medium text-default-800">
                    {option.title}
                    {option.mode === 'BEST_OF' && (
                      <span className="ms-2 text-xs font-normal text-default-400">Default</span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-default-500">{option.example}</span>
                </span>
              </label>
            );
          })}
        </div>
      )}
    </SettingsCard>
  );
}
