import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { LuPencil, LuPlus, LuTicket, LuTrash2 } from 'react-icons/lu';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import {
  referralCodeFormValues,
  type AffiliateFormValues,
  type ReferralCodeFormValues,
} from '../../affiliate-form.schema';
import type { ReferralCodeInput } from '../../affiliates.api';
import { ReferralCodeFormDialog } from '../codes/ReferralCodeFormDialog';

interface DraftCodesListProps {
  form: UseFormReturn<AffiliateFormValues>;
  /** Lets the affiliate dialog ignore Escape while this dialog is on top of it. */
  onCodeDialogOpenChange: (isOpen: boolean) => void;
}

// draftIndex null = adding a new code. Values are captured on open so re-renders never reset typing.
type CodeDialogTarget = { draftIndex: number | null; initialValues: ReferralCodeFormValues } | null;

const BLANK_CODE_VALUES = referralCodeFormValues();

function limitsSummary(draftCode: ReferralCodeInput): string {
  const usage = draftCode.maxRedemptions
    ? `Up to ${draftCode.maxRedemptions} sign-ups`
    : 'No usage limit';
  const expiry = draftCode.expiresAt
    ? `expires ${formatDate(draftCode.expiresAt)}`
    : 'never expires';
  return `${usage}, ${expiry}`;
}

export function DraftCodesList({ form, onCodeDialogOpenChange }: DraftCodesListProps) {
  const draftCodes = form.watch('referralCodes');
  const [codeDialogTarget, setCodeDialogTarget] = useState<CodeDialogTarget>(null);
  const editedDraftIndex = codeDialogTarget?.draftIndex ?? null;

  const openCodeDialog = (draftIndex: number | null) => {
    setCodeDialogTarget({
      draftIndex,
      initialValues: referralCodeFormValues(draftIndex === null ? null : draftCodes[draftIndex]),
    });
    onCodeDialogOpenChange(true);
  };

  const closeCodeDialog = () => {
    setCodeDialogTarget(null);
    onCodeDialogOpenChange(false);
  };

  // Typed codes must be unique; blank ones are generated server side and never clash.
  const saveDraftCode = (codeInput: ReferralCodeInput) => {
    const isDuplicate =
      !!codeInput.code &&
      draftCodes.some(
        (draftCode, draftIndex) =>
          draftIndex !== editedDraftIndex && draftCode.code === codeInput.code
      );
    if (isDuplicate) {
      toast.error(`${codeInput.code} is already in this list`);
      return;
    }
    const nextDraftCodes =
      editedDraftIndex === null
        ? [...draftCodes, codeInput]
        : draftCodes.map((draftCode, draftIndex) =>
            draftIndex === editedDraftIndex ? codeInput : draftCode
          );
    form.setValue('referralCodes', nextDraftCodes);
    closeCodeDialog();
  };

  const removeDraftCode = (removedIndex: number) =>
    form.setValue(
      'referralCodes',
      draftCodes.filter((_, draftIndex) => draftIndex !== removedIndex)
    );

  return (
    <div className="space-y-3">
      {draftCodes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-default-300 px-4 py-8 text-center">
          <LuTicket className="size-6 text-default-400" />
          <p className="max-w-sm text-sm text-default-500">
            No codes yet. Add as many as you like now, or skip this and add them later from the
            affiliate page.
          </p>
          <Button type="button" size="sm" onClick={() => openCodeDialog(null)}>
            <LuPlus className="size-4 me-1" /> Add code
          </Button>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {draftCodes.map((draftCode, draftIndex) => (
              <li
                key={`${draftCode.code ?? 'generated'}-${draftIndex}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-default-200 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold">
                      {draftCode.code ?? 'Generated from the name'}
                    </span>
                    <Badge tone="primary">{draftCode.discountPercent}% off</Badge>
                    {draftCode.isActive === false && <Badge tone="warning">Paused</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-default-500">{limitsSummary(draftCode)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit code"
                    onClick={() => openCodeDialog(draftIndex)}
                  >
                    <LuPencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove code"
                    className="hover:text-danger"
                    onClick={() => removeDraftCode(draftIndex)}
                  >
                    <LuTrash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <Button type="button" variant="soft" size="sm" onClick={() => openCodeDialog(null)}>
            <LuPlus className="size-4 me-1" /> Add another code
          </Button>
        </>
      )}

      <ReferralCodeFormDialog
        open={codeDialogTarget !== null}
        onOpenChange={isOpen => !isOpen && closeCodeDialog()}
        title={editedDraftIndex === null ? 'New referral code' : 'Edit code'}
        submitLabel={editedDraftIndex === null ? 'Add code' : 'Save code'}
        initialValues={codeDialogTarget?.initialValues ?? BLANK_CODE_VALUES}
        onSave={saveDraftCode}
      />
    </div>
  );
}
