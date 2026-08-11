import { LuCheck } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPlanPeriod, formatPlanPrice } from '@/lib/planFormat';
import type { PlanFormValues } from '../plan-form.schema';

interface PlanPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Snapshot of the form at the moment the preview was opened. */
  values: PlanFormValues | null;
}

/** How the plan card will look on the public pricing section. */
export function PlanPreviewDialog({ open, onOpenChange, values }: PlanPreviewDialogProps) {
  if (!values) return null;

  const hasOffer =
    !values.isTrial && values.originalPrice != null && values.originalPrice > values.price;
  const discountPercentage = hasOffer
    ? Math.round((1 - values.price / (values.originalPrice as number)) * 100)
    : null;
  const period = formatPlanPeriod(values.duration, values.customDurationDays);
  const featureBullets = values.features.map(feature => feature.value.trim()).filter(Boolean);

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Plan preview" size="sm">
      <p className="mb-4 text-sm text-default-500">
        How this card appears on the public pricing section.
      </p>

      <div
        className={cn(
          'relative overflow-hidden rounded-xl border bg-card p-6',
          values.isFeatured ? 'border-primary ring-[3px] ring-primary/15' : 'border-default-200'
        )}
      >
        {values.isFeatured && (
          <span className="absolute -end-9 top-5 rotate-45 bg-primary px-10 py-0.5 text-xs font-semibold text-white">
            Popular
          </span>
        )}

        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-default-900">{values.name || 'Plan name'}</h3>
          <Badge tone="neutral">{values.tier}</Badge>
          {values.isComingSoon && <Badge tone="warning">Coming soon</Badge>}
        </div>
        {values.tagline && <p className="mt-1 text-sm text-default-500">{values.tagline}</p>}

        <div className="mt-5 flex flex-wrap items-baseline gap-2">
          {hasOffer && (
            <s className="text-base text-default-400">
              {formatPlanPrice(values.originalPrice as number, values.currency)}
            </s>
          )}
          <span className="text-3xl font-bold text-default-900">
            {values.isTrial ? 'Free' : formatPlanPrice(values.price, values.currency)}
          </span>
          <span className="text-sm text-default-500">/ {period}</span>
          {discountPercentage != null && <Badge tone="success">{discountPercentage}% off</Badge>}
        </div>

        {featureBullets.length > 0 ? (
          <ul className="mt-5 space-y-2.5">
            {featureBullets.map(featureText => (
              <li key={featureText} className="flex items-start gap-2 text-sm text-default-700">
                <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <LuCheck className="size-3" />
                </span>
                {featureText}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 rounded-lg border border-dashed border-default-200 px-3 py-4 text-center text-xs text-default-400">
            No feature bullets yet — add some under “Landing page display”.
          </p>
        )}

        <span
          className={cn(
            buttonVariants({ variant: values.isComingSoon ? 'soft' : 'default' }),
            'pointer-events-none mt-6 w-full'
          )}
        >
          {values.isComingSoon
            ? 'Coming soon'
            : values.ctaLabel.trim() || `Start with ${values.name.trim() || 'this plan'}`}
        </span>

        {!values.isPublic && (
          <p className="mt-3 text-center text-xs text-warning">
            Not public — this card won't be listed on pricing pages.
          </p>
        )}
      </div>
    </Modal>
  );
}
