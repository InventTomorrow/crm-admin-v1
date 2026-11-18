import { useEffect, useState, type FormEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { useForm, type FieldErrors } from 'react-hook-form';
import { LuArrowLeft, LuArrowRight } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import type { SearchSelectOption } from '@/components/ui/search-select';
import { formatFullName } from '@/lib/format';
import {
  affiliateFormDefaults,
  affiliateFormSchema,
  toAffiliateInput,
  toInviteInput,
  type AffiliateFormValues,
} from '../../affiliate-form.schema';
import {
  useCreateAffiliate,
  useUpdateAffiliate,
  type CreateAffiliateResult,
} from '../../affiliates.hooks';
import type { Affiliate } from '../../types';
import { InviteLinkPanel } from '../join/InviteLinkPanel';
import { affiliateFormStepsFor, type AffiliateFormStepId } from './affiliate-form-steps';
import { AffiliateDetailsFields } from './AffiliateDetailsFields';
import { AffiliateSignInFields } from './AffiliateSignInFields';
import { DraftCodesList } from './DraftCodesList';
import { FormStepIndicator } from './FormStepIndicator';
import { SelfServeCodesField } from './SelfServeCodesField';

interface AffiliateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Omit to create a new affiliate. */
  affiliate?: Affiliate | null;
  onCreated?: (affiliate: Affiliate) => void;
}

// Direction-aware slide: forward enters from the right, Back from the left.
const STEP_VARIANTS: Variants = {
  enter: (direction: number) => ({ x: direction * 28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction * -28, opacity: 0 }),
};

function linkedUserOption(affiliate?: Affiliate | null): SearchSelectOption | null {
  if (!affiliate?.user) return null;
  const fullName = formatFullName(affiliate.user.firstName, affiliate.user.lastName);
  return {
    id: affiliate.user.id,
    label: fullName === 'N/A' ? affiliate.user.email : fullName,
    sub: affiliate.user.email,
  };
}

/** Create and edit both walk through steps; editing can jump to any step and save from each. */
export function AffiliateFormDialog({
  open,
  onOpenChange,
  affiliate,
  onCreated,
}: AffiliateFormDialogProps) {
  const isEditing = Boolean(affiliate);
  const steps = affiliateFormStepsFor(isEditing);
  const lastStepIndex = steps.length - 1;
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [stepDirection, setStepDirection] = useState(1);
  const [selectedUser, setSelectedUser] = useState<SearchSelectOption | null>(null);
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  // Kept open after create so the join link can be copied: it is never shown again.
  const [createdWithLink, setCreatedWithLink] = useState<CreateAffiliateResult | null>(null);
  const createAffiliateMutation = useCreateAffiliate();
  const updateAffiliateMutation = useUpdateAffiliate(affiliate?.id ?? '');
  const isSaving = createAffiliateMutation.isPending || updateAffiliateMutation.isPending;
  const isLastStep = activeStepIndex === lastStepIndex;

  const form = useForm<AffiliateFormValues>({
    resolver: zodResolver(affiliateFormSchema),
    defaultValues: affiliateFormDefaults(affiliate),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(affiliateFormDefaults(affiliate));
    setSelectedUser(linkedUserOption(affiliate));
    setCreatedWithLink(null);
    setActiveStepIndex(0);
    setStepDirection(1);
    setIsCodeDialogOpen(false);
  }, [open, affiliate, form]);

  const goToStep = (stepIndex: number) => {
    setStepDirection(stepIndex > activeStepIndex ? 1 : -1);
    setActiveStepIndex(stepIndex);
  };

  const goToNextStep = async () => {
    const isStepValid = await form.trigger(steps[activeStepIndex].fields);
    if (isStepValid) goToStep(Math.min(activeStepIndex + 1, lastStepIndex));
  };

  const finishCreate = (result: CreateAffiliateResult) => {
    onOpenChange(false);
    onCreated?.(result.affiliate);
  };

  // Picking an existing account fills the contact fields, without overwriting typed values.
  const onUserSelected = (userOption: SearchSelectOption | null) => {
    setSelectedUser(userOption);
    form.setValue('userId', userOption?.id ?? '', { shouldValidate: form.formState.isSubmitted });
    if (!userOption) return;
    if (!form.getValues('name').trim() && userOption.label !== userOption.sub) {
      form.setValue('name', userOption.label);
    }
    if (!form.getValues('email').trim() && userOption.sub) {
      form.setValue('email', userOption.sub);
    }
  };

  const saveAffiliate = (values: AffiliateFormValues) => {
    const affiliateInput = toAffiliateInput(values, isEditing);
    if (affiliate) {
      updateAffiliateMutation.mutate(affiliateInput, { onSuccess: () => onOpenChange(false) });
      return;
    }
    createAffiliateMutation.mutate(
      { affiliate: affiliateInput, codes: values.referralCodes, invite: toInviteInput(values) },
      {
        onSuccess: result =>
          result.invite?.outcome === 'INVITED' ? setCreatedWithLink(result) : finishCreate(result),
      }
    );
  };

  const showFirstStepWithErrors = (errors: FieldErrors<AffiliateFormValues>) => {
    const stepIndex = steps.findIndex(step => step.fields.some(fieldName => fieldName in errors));
    if (stepIndex >= 0) goToStep(stepIndex);
  };

  // Enter saves when editing; while creating it moves forward instead of submitting half the form.
  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (isEditing || isLastStep) {
      return form.handleSubmit(saveAffiliate, showFirstStepWithErrors)(event);
    }
    event.preventDefault();
    void goToNextStep();
  };

  const renderStep = (stepId: AffiliateFormStepId) => {
    if (stepId === 'account') {
      return (
        <AffiliateSignInFields
          form={form}
          isEditing={isEditing}
          isOpen={open}
          selectedUser={selectedUser}
          onUserSelected={onUserSelected}
        />
      );
    }
    if (stepId === 'details') return <AffiliateDetailsFields form={form} isEditing={isEditing} />;
    return (
      <div className="space-y-4">
        <SelfServeCodesField form={form} />
        {isEditing ? (
          <p className="text-xs text-default-500">
            Add, pause or delete individual codes from the affiliate page.
          </p>
        ) : (
          <div className="space-y-2">
            <span className="form-label block text-sm font-medium text-default-700">
              Codes to create now
            </span>
            <DraftCodesList form={form} onCodeDialogOpenChange={setIsCodeDialogOpen} />
          </div>
        )}
      </div>
    );
  };

  const activeStep = steps[activeStepIndex];

  return (
    <Modal
      open={open}
      // Escape reaches every open modal; only the code dialog on top should close.
      onOpenChange={isOpen => (isOpen || !isCodeDialogOpen) && onOpenChange(isOpen)}
      title={
        createdWithLink ? 'Affiliate added' : isEditing ? 'Edit affiliate' : 'Add an affiliate'
      }
      size="lg"
    >
      {createdWithLink?.invite?.outcome === 'INVITED' ? (
        <InviteLinkPanel
          invite={createdWithLink.invite}
          onDone={() => finishCreate(createdWithLink)}
        />
      ) : (
        <form onSubmit={onFormSubmit} noValidate>
          <FormStepIndicator
            steps={steps}
            activeStepIndex={activeStepIndex}
            onStepSelect={goToStep}
            canJumpToAnyStep={isEditing}
          />

          <div className="overflow-hidden">
            <AnimatePresence mode="wait" initial={false} custom={stepDirection}>
              <motion.div
                key={activeStep.id}
                custom={stepDirection}
                variants={STEP_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {renderStep(activeStep.id)}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-between gap-2">
            {activeStepIndex > 0 ? (
              <Button type="button" variant="ghost" onClick={() => goToStep(activeStepIndex - 1)}>
                <LuArrowLeft className="size-4 me-1" /> Back
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            )}
            <div className="flex items-center gap-2">
              {!isLastStep && (
                <Button
                  type={isEditing ? 'button' : 'submit'}
                  variant={isEditing ? 'outline' : 'default'}
                  onClick={isEditing ? () => void goToNextStep() : undefined}
                >
                  Next <LuArrowRight className="size-4 ms-1" />
                </Button>
              )}
              {(isEditing || isLastStep) && (
                <Button type="submit" loading={isSaving} disabled={isSaving}>
                  {isEditing ? 'Save changes' : 'Add affiliate'}
                </Button>
              )}
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
