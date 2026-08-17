import { isUnlimitedLimit } from '@/lib/planFormat';
import { UNIVERSAL } from './plan-form.schema';
import type { PlanFormValues } from './plan-form.schema';

/**
 * Turns the limits an admin has already typed into the sentences a customer
 * reads on the plan card.
 *
 * The numeric fields ARE the plan's selling points — re-typing them as prose
 * is duplicate work that drifts the moment a limit changes. These bullets are
 * a starting point only: the form seeds them, and the admin is free to edit,
 * reorder, remove or add before saving.
 */

const count = (value: number, singular: string, plural = `${singular}s`): string => {
  if (isUnlimitedLimit(value)) return `Unlimited ${plural}`;
  return `${value.toLocaleString('en-PK')} ${value === 1 ? singular : plural}`;
};

/** Zero means the plan doesn't include the resource, so it earns no bullet. */
const isIncluded = (value: number): boolean => value !== 0;

/** The catalogue line belongs to whichever vertical the plan is scoped to. */
function catalogBullet(values: PlanFormValues): string | null {
  switch (values.businessVertical) {
    case 'ECOMMERCE':
      return isIncluded(values.maxProducts) ? count(values.maxProducts, 'product') : null;
    case 'RESTAURANT':
      return isIncluded(values.maxMenuItems) ? count(values.maxMenuItems, 'menu item') : null;
    case 'MARKETING_AGENCY':
      return isIncluded(values.maxServices) ? count(values.maxServices, 'service') : null;
    default:
      // A universal plan carries all three counts, so name each one.
      return [
        isIncluded(values.maxProducts) ? count(values.maxProducts, 'product') : null,
        isIncluded(values.maxMenuItems) ? count(values.maxMenuItems, 'menu item') : null,
        isIncluded(values.maxServices) ? count(values.maxServices, 'service') : null,
      ]
        .filter(Boolean)
        .join(' · ') || null;
  }
}

/** Ordered bullets derived from the plan's own numbers. */
export function deriveFeatureBullets(values: PlanFormValues): string[] {
  const bullets: (string | null)[] = [
    isIncluded(values.maxWorkspaces) ? count(values.maxWorkspaces, 'workspace') : null,
    isIncluded(values.maxMembersPerWorkspace)
      ? `${count(values.maxMembersPerWorkspace, 'team member')} per workspace`
      : 'Single user — no team seats',
    isIncluded(values.maxChannels)
      ? `${count(values.maxChannels, 'WhatsApp channel')} connected`
      : null,
    isIncluded(values.maxMonthlyMessages)
      ? `${count(values.maxMonthlyMessages, 'AI message')} per month`
      : null,
    isIncluded(values.maxImageMessages)
      ? `${count(values.maxImageMessages, 'image')} understood by AI vision`
      : null,
    isIncluded(values.maxVoiceMessages)
      ? `${count(values.maxVoiceMessages, 'voice message')} transcribed`
      : null,
    catalogBullet(values),
  ];

  return bullets.filter((bullet): bullet is string => Boolean(bullet));
}

/** The limit fields the bullets are built from — used to watch for changes. */
export function featureSourceSignature(values: PlanFormValues): string {
  return [
    values.businessVertical ?? UNIVERSAL,
    values.maxWorkspaces,
    values.maxMembersPerWorkspace,
    values.maxChannels,
    values.maxMonthlyMessages,
    values.maxImageMessages,
    values.maxVoiceMessages,
    values.maxProducts,
    values.maxMenuItems,
    values.maxServices,
  ].join('|');
}
