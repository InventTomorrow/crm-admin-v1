import { UNIVERSAL, type PlanFormValues } from './plan-form.schema';

/**
 * Live (partial) form values — `useWatch` hands back a deep-partial snapshot
 * while the user is still typing, so every field here is optional.
 */
export interface PlanFormProgressValues {
  name?: string;
  businessVertical?: PlanFormValues['businessVertical'];
  duration?: PlanFormValues['duration'];
  customDurationDays?: number | null;
  currency?: string;
  price?: number;
  wholesalePrice?: number;
  maxWorkspaces?: number;
  maxMembersPerWorkspace?: number;
  maxChannels?: number;
  maxProducts?: number;
  maxMenuItems?: number;
  maxServices?: number;
  maxMonthlyMessages?: number;
  maxImageMessages?: number;
  maxVoiceMessages?: number;
}

export interface PlanFormSectionProgress {
  id: string;
  title: string;
  filledCount: number;
  requiredCount: number;
  isComplete: boolean;
  /** No required fields in this section — nothing to track. */
  isOptional: boolean;
}

export interface PlanFormProgress {
  sections: PlanFormSectionProgress[];
  filledCount: number;
  requiredCount: number;
  percentage: number;
}

// Cleared number inputs come back as NaN, never as an empty string.
const isNumberFilled = (value: number | null | undefined) => value != null && !Number.isNaN(value);

const isTextFilled = (value: string | undefined) => !!value?.trim();

/**
 * Per-section fill state for the form progress rail — counts only fields the
 * schema actually requires. Mirrors the section order in PlanFormView.
 */
export function getPlanFormProgress(values: PlanFormProgressValues): PlanFormProgress {
  const vertical = values.businessVertical ?? UNIVERSAL;

  const resourceChecks = [
    ...(vertical === UNIVERSAL || vertical === 'ECOMMERCE'
      ? [isNumberFilled(values.maxProducts)]
      : []),
    ...(vertical === UNIVERSAL || vertical === 'RESTAURANT'
      ? [isNumberFilled(values.maxMenuItems)]
      : []),
    ...(vertical === UNIVERSAL || vertical === 'MARKETING_AGENCY'
      ? [isNumberFilled(values.maxServices)]
      : []),
    ...(vertical === UNIVERSAL || vertical === 'HEALTHCARE'
      ? [isNumberFilled(values.maxClinicalServices)]
      : []),
  ];

  const sectionChecks: { id: string; title: string; checks: boolean[] }[] = [
    // Tier and business category always hold a value; the tagline is optional.
    { id: 'basics', title: 'Basics', checks: [isTextFilled(values.name)] },
    {
      id: 'pricing',
      title: 'Pricing & offer',
      checks: [
        isNumberFilled(values.price),
        isNumberFilled(values.wholesalePrice),
        // The currency input is swapped for trial length on a custom duration.
        values.duration === 'CUSTOM_DAYS'
          ? isNumberFilled(values.customDurationDays)
          : (values.currency ?? '').trim().length === 3,
      ],
    },
    {
      id: 'workspaces',
      title: 'Workspaces & team',
      checks: [
        isNumberFilled(values.maxWorkspaces),
        isNumberFilled(values.maxMembersPerWorkspace),
        isNumberFilled(values.maxChannels),
      ],
    },
    { id: 'resources', title: 'Resource limits', checks: resourceChecks },
    {
      id: 'messages',
      title: 'Message limits',
      checks: [
        isNumberFilled(values.maxMonthlyMessages),
        isNumberFilled(values.maxImageMessages),
        isNumberFilled(values.maxVoiceMessages),
      ],
    },
    // Features, button label and the toggles are all optional.
    { id: 'landing', title: 'Landing page display', checks: [] },
    { id: 'visibility', title: 'Visibility', checks: [] },
  ];

  const sections = sectionChecks.map(section => {
    const filledCount = section.checks.filter(Boolean).length;
    return {
      id: section.id,
      title: section.title,
      filledCount,
      requiredCount: section.checks.length,
      isComplete: filledCount === section.checks.length,
      isOptional: section.checks.length === 0,
    };
  });

  const filledCount = sections.reduce((sum, section) => sum + section.filledCount, 0);
  const requiredCount = sections.reduce((sum, section) => sum + section.requiredCount, 0);

  return {
    sections,
    filledCount,
    requiredCount,
    percentage: requiredCount === 0 ? 100 : Math.round((filledCount / requiredCount) * 100),
  };
}
