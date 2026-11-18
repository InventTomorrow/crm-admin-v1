import type { FieldPath } from 'react-hook-form';
import type { AffiliateFormValues } from '../../affiliate-form.schema';

export type AffiliateFormStepId = 'account' | 'details' | 'codes';

export interface AffiliateFormStep {
  id: AffiliateFormStepId;
  title: string;
  description: string;
  // Validated before moving on, so each step only reports its own errors.
  fields: FieldPath<AffiliateFormValues>[];
}

const CREATE_STEPS: AffiliateFormStep[] = [
  {
    id: 'account',
    title: 'Sign in',
    description: 'How they get an account',
    fields: ['joinOption', 'userId', 'sendInviteEmail'],
  },
  {
    id: 'details',
    title: 'Details',
    description: 'Contact and commission',
    fields: ['name', 'email', 'phone', 'commissionPercent', 'notes'],
  },
  {
    id: 'codes',
    title: 'Referral codes',
    description: 'Their own codes and yours',
    fields: ['selfServeMaxDiscountPercent', 'referralCodes'],
  },
];

const EDIT_STEPS: AffiliateFormStep[] = [
  { id: 'account', title: 'Account', description: 'Linked sign-in account', fields: ['userId'] },
  {
    id: 'details',
    title: 'Details',
    description: 'Contact, commission, status',
    fields: ['name', 'email', 'phone', 'commissionPercent', 'status', 'notes'],
  },
  {
    id: 'codes',
    title: 'Referral codes',
    description: 'Codes they create',
    fields: ['selfServeMaxDiscountPercent'],
  },
];

export const affiliateFormStepsFor = (isEditing: boolean) =>
  isEditing ? EDIT_STEPS : CREATE_STEPS;
