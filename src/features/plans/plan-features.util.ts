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

const count = (value: number, singular: string, plural = `${singular}s`): string =>
  `${value.toLocaleString('en-PK')} ${value === 1 ? singular : plural}`;

/** The catalogue line belongs to whichever vertical the plan is scoped to. */
function catalogBullet(values: PlanFormValues): string | null {
  switch (values.businessVertical) {
    case 'ECOMMERCE':
      return values.maxProducts > 0 ? count(values.maxProducts, 'product') : null;
    case 'RESTAURANT':
      return values.maxMenuItems > 0 ? count(values.maxMenuItems, 'menu item') : null;
    case 'MARKETING_AGENCY':
      return values.maxServices > 0 ? count(values.maxServices, 'service') : null;
    default:
      // A universal plan carries all three counts, so name each one.
      return [
        values.maxProducts > 0 ? count(values.maxProducts, 'product') : null,
        values.maxMenuItems > 0 ? count(values.maxMenuItems, 'menu item') : null,
        values.maxServices > 0 ? count(values.maxServices, 'service') : null,
      ]
        .filter(Boolean)
        .join(' · ') || null;
  }
}

/** Ordered bullets derived from the plan's own numbers. */
export function deriveFeatureBullets(values: PlanFormValues): string[] {
  const bullets: (string | null)[] = [
    values.maxWorkspaces > 0 ? count(values.maxWorkspaces, 'workspace') : null,
    values.maxMembersPerWorkspace > 0
      ? `${count(values.maxMembersPerWorkspace, 'team member')} per workspace`
      : 'Single user — no team seats',
    values.maxChannels > 0 ? `${count(values.maxChannels, 'WhatsApp channel')} connected` : null,
    values.maxMonthlyMessages > 0
      ? `${count(values.maxMonthlyMessages, 'AI message')} per month`
      : null,
    values.maxImageMessages > 0
      ? `${count(values.maxImageMessages, 'image')} understood by AI vision`
      : null,
    values.maxVoiceMessages > 0
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
