import { LuArrowRight, LuCheck } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { formatPlanPeriod, formatPlanPrice } from '@/lib/planFormat';
import type { PlanFormValues } from '../plan-form.schema';

/**
 * The two public surfaces render plans with their own palettes, neither of
 * which is admin2's. Reproducing them faithfully means pinning their colours
 * here rather than reaching for Tailwick tokens that would look wrong.
 *
 * Landing page  → landing-page/tailwind.config.js  (brand.*)
 * In-app        → client/src/app/globals.css       (--accent, --ink, …)
 */
const LANDING = {
  dark: '#14403A',
  green: '#16A572',
  leaf2: '#C4E2B0',
  text: '#6B7670',
  mint3: '#F1F8F2',
} as const;

const APP = {
  accent: '#1DAA61',
  accentSoft: 'rgba(29, 170, 97, 0.10)',
  ink: '#111B21',
  inkSoft: '#3B4A54',
  line: '#E9EDEF',
  surface2: '#F7F8FA',
} as const;

export type PreviewSurface = 'landing' | 'app';

/** Bare number — the landing card renders the currency as its own element. */
function priceDigits(price: number): string {
  return price.toLocaleString('en-PK');
}

/**
 * The plan card as one of the two public surfaces would draw it, from live
 * form values. Rendered in the form's sidebar so the effect of a field is
 * visible while it is being typed.
 */
export function PlanPreviewCard({
  values,
  surface,
}: {
  values: PlanFormValues;
  surface: PreviewSurface;
}) {
  const hasOffer =
    !values.isTrial && values.originalPrice != null && values.originalPrice > values.price;
  const discountPercentage = hasOffer
    ? Math.round((1 - values.price / (values.originalPrice as number)) * 100)
    : null;
  const period = formatPlanPeriod(values.duration, values.customDurationDays);
  const features = values.features.map(feature => feature.value.trim()).filter(Boolean);
  const planName = values.name.trim() || 'Plan name';
  const ctaLabel = values.ctaLabel.trim() || `Start with ${values.name.trim() || 'this plan'}`;

  const shared = { values, planName, period, features, hasOffer, discountPercentage, ctaLabel };

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: surface === 'landing' ? LANDING.mint3 : '#F0F2F5' }}
    >
      {surface === 'landing' ? <LandingCard {...shared} /> : <InAppCard {...shared} />}
    </div>
  );
}

interface CardProps {
  values: PlanFormValues;
  planName: string;
  period: string;
  features: string[];
  hasOffer: boolean;
  discountPercentage: number | null;
  ctaLabel: string;
}

/** Mirrors landing-page/src/components/sections/Pricing.jsx. */
function LandingCard({
  values,
  planName,
  period,
  features,
  hasOffer,
  discountPercentage,
  ctaLabel,
}: CardProps) {
  const featured = values.isFeatured;

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-3xl p-6',
        featured ? 'text-white' : 'border border-gray-100 bg-white'
      )}
      style={{
        background: featured ? LANDING.dark : undefined,
        color: featured ? '#fff' : LANDING.dark,
        boxShadow: featured
          ? '0 30px 80px -20px rgba(20,64,58,0.18)'
          : '0 1px 2px rgba(20,64,58,0.04), 0 4px 16px rgba(20,64,58,0.04)',
      }}
    >
      {featured && (
        <span
          className="absolute end-5 top-5 rounded-full px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-white"
          style={{ background: LANDING.green }}
        >
          Most Popular
        </span>
      )}

      <h3 className="text-lg font-bold">{planName}</h3>
      <p
        className="mt-2 text-[0.9375rem] leading-relaxed"
        style={{ color: featured ? 'rgba(255,255,255,0.7)' : LANDING.text }}
      >
        {values.tagline.trim() || 'Add a tagline to describe who this plan is for.'}
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-1">
        <span
          className="text-[0.95rem] font-medium"
          style={{ color: featured ? 'rgba(255,255,255,0.7)' : LANDING.text }}
        >
          {values.currency === 'PKR' ? 'Rs' : values.currency}
        </span>
        <span className="text-[2.25rem] font-bold leading-none tracking-tight">
          {values.isTrial ? 'Free' : priceDigits(values.price)}
        </span>
        <span
          className="mb-1 text-[0.9375rem]"
          style={{ color: featured ? 'rgba(255,255,255,0.6)' : LANDING.text }}
        >
          /{period}
        </span>
        {hasOffer && (
          <span className="mb-1 ms-1 flex items-baseline gap-1.5">
            <s
              className="text-[0.9375rem]"
              style={{ color: featured ? 'rgba(255,255,255,0.5)' : LANDING.text }}
            >
              {priceDigits(values.originalPrice as number)}
            </s>
            <span
              className="rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold text-white"
              style={{ background: LANDING.green }}
            >
              {discountPercentage}% off
            </span>
          </span>
        )}
      </div>

      <div className="my-5 h-px w-full bg-current opacity-10" />

      {features.length > 0 ? (
        <ul className="flex-1 space-y-2.5">
          {features.map(feature => (
            <li key={feature} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: featured ? LANDING.green : LANDING.leaf2,
                  color: featured ? '#fff' : LANDING.dark,
                }}
              >
                <LuCheck className="size-3.5" strokeWidth={3} />
              </span>
              <span
                className="text-[0.9375rem] leading-snug"
                style={{ color: featured ? 'rgba(255,255,255,0.9)' : LANDING.text }}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p
          className="flex-1 rounded-lg border border-dashed px-3 py-4 text-center text-xs"
          style={{ borderColor: featured ? 'rgba(255,255,255,0.25)' : '#DDE6DE', color: LANDING.text }}
        >
          No feature bullets yet — the landing card lists these, not the plan limits.
        </p>
      )}

      <div className="mt-6">
        <span
          className="flex w-full items-center justify-center rounded-full px-6 py-3 text-[0.9375rem] font-semibold"
          style={
            featured
              ? { background: '#fff', color: LANDING.dark }
              : { background: LANDING.green, color: '#fff', boxShadow: '0 6px 20px rgba(22,165,114,0.28)' }
          }
        >
          {values.isComingSoon ? 'Coming soon' : ctaLabel}
        </span>
      </div>
    </div>
  );
}

/** Mirrors client/src/features/billing/components/PlanCard.tsx. */
function InAppCard({ values, planName, period, features, ctaLabel }: CardProps) {
  const inert = values.isComingSoon;

  return (
    <div
      className={cn('relative flex flex-col rounded-xl border bg-white p-5', inert && 'opacity-60')}
      style={{
        borderColor: values.isFeatured && !inert ? APP.accent : APP.line,
        color: APP.ink,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[17px] font-semibold">{planName}</h3>
        <div className="flex items-center gap-1.5">
          {values.isFeatured && !inert && (
            <span
              className="rounded px-2 py-0.5 text-[11px] font-medium text-white"
              style={{ background: APP.accent }}
            >
              Popular
            </span>
          )}
          {inert && (
            <span className="rounded bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">
              Coming soon
            </span>
          )}
          {values.isTrial && !inert && (
            <span className="rounded bg-info/10 px-2 py-0.5 text-[11px] font-medium text-info">
              Trial
            </span>
          )}
        </div>
      </div>

      <div className="mt-3">
        <span className="text-[26px] font-bold">
          {values.isTrial ? 'Free' : formatPlanPrice(values.price, values.currency)}
        </span>
        <span className="text-[13px]" style={{ color: APP.inkSoft }}>
          {' '}
          / {period}
        </span>
      </div>

      <div className="mt-4 flex-1">
        {features.length > 0 ? (
          <ul className="space-y-2">
            {features.map(feature => (
              <li
                key={feature}
                className="flex items-start gap-2 text-[13px]"
                style={{ color: APP.inkSoft }}
              >
                <span className="mt-0.5">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        ) : (
          // The real card falls back to PlanLimitsList when a plan has no
          // bullets, so the limits are what the customer would actually read.
          <ul className="space-y-2 text-[13px]" style={{ color: APP.inkSoft }}>
            <LimitRow label="Workspaces" value={values.maxWorkspaces} />
            <LimitRow label="Team members / workspace" value={values.maxMembersPerWorkspace} />
            <LimitRow label="Connected channels" value={values.maxChannels} />
            <LimitRow label="Messages / month" value={values.maxMonthlyMessages} />
          </ul>
        )}

      </div>

      <span
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium"
        style={
          inert
            ? { border: `1px solid ${APP.line}`, color: APP.inkSoft, background: APP.surface2 }
            : { background: APP.accent, color: '#fff' }
        }
      >
        {inert ? 'Coming soon' : ctaLabel}
        {!inert && <LuArrowRight className="size-3.5" />}
      </span>
    </div>
  );
}

function LimitRow({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <span className="font-medium" style={{ color: APP.ink }}>
        {value.toLocaleString('en-PK')}
      </span>
    </li>
  );
}
