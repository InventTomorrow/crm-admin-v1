import { useMemo, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LuArrowLeft, LuCircleCheck, LuFileDown, LuTrash2, LuWallet } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { formatMoneyPKR } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  forceDeleteConfirmSchema,
  type ForceDeleteConfirmValues,
} from '../../affiliate-form.schema';
import { useDownloadAffiliateStatement, useForceDeleteAffiliate } from '../../affiliates.hooks';
import type { AffiliateRemovalHistory } from './DeleteAffiliateDialog';

interface ForceDeleteStepsProps {
  affiliate: { id: string; name: string };
  history: AffiliateRemovalHistory;
  onBack: () => void;
  onDeleted: () => void;
}

function StepCard({
  stepNumber,
  title,
  isDone,
  children,
}: {
  stepNumber: number;
  title: string;
  isDone?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-default-200 p-3">
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          isDone ? 'bg-success text-white' : 'bg-default-150 text-default-700'
        )}
      >
        {isDone ? <LuCircleCheck className="size-4" /> : stepNumber}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <h4 className="text-sm font-medium text-default-800">{title}</h4>
        {children}
      </div>
    </div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <Button type="button" variant="ghost" onClick={onBack}>
      <LuArrowLeft className="size-4 me-1" /> Back
    </Button>
  );
}

export function ForceDeleteSteps({ affiliate, history, onBack, onDeleted }: ForceDeleteStepsProps) {
  const downloadStatementMutation = useDownloadAffiliateStatement();
  const forceDeleteMutation = useForceDeleteAffiliate();
  const confirmSchema = useMemo(() => forceDeleteConfirmSchema(affiliate.name), [affiliate.name]);
  const form = useForm<ForceDeleteConfirmValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { confirmName: '' },
    mode: 'onChange',
  });
  const isStatementDownloaded = downloadStatementMutation.isSuccess;
  const canDelete = isStatementDownloaded && form.formState.isValid;

  if (history.commissionOwed > 0) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm">
          <LuWallet className="mt-0.5 size-5 shrink-0 text-danger" />
          <div className="space-y-1">
            <p className="font-medium text-default-800">Settle what they are owed first</p>
            <p className="text-default-600">
              {formatMoneyPKR(history.commissionOwed)} in commission is still unpaid. Use Mark as
              paid on their page to record the payout, then come back to delete them.
            </p>
          </div>
        </div>
        <BackButton onBack={onBack} />
      </div>
    );
  }

  const deleteForGood = (values: ForceDeleteConfirmValues) =>
    forceDeleteMutation.mutate(
      { affiliateId: affiliate.id, confirmName: values.confirmName },
      { onSuccess: onDeleted }
    );

  return (
    <form onSubmit={form.handleSubmit(deleteForGood)} noValidate className="space-y-4">
      <div className="space-y-2 text-sm text-default-600">
        <p>
          This permanently removes{' '}
          <span className="font-medium text-default-800">{affiliate.name}</span> with all their
          referral codes, {history.signups} referral record
          {history.signups === 1 ? '' : 's'}, their payout history and any pending join link. It
          cannot be undone.
        </p>
        <ul className="list-disc space-y-1 ps-5">
          <li>Their login account stays. It is only unlinked from the affiliate program.</li>
          <li>Customers who signed up with their codes but have not paid yet lose the discount.</li>
        </ul>
      </div>

      <StepCard stepNumber={1} title="Download their statement" isDone={isStatementDownloaded}>
        <p className="text-sm text-default-500">
          A PDF with their profile, codes, every referral, earnings and payouts. Keep it for your
          records.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={downloadStatementMutation.isPending}
          disabled={downloadStatementMutation.isPending}
          onClick={() => downloadStatementMutation.mutate(affiliate.id)}
        >
          <LuFileDown className="size-4 me-1" />
          {isStatementDownloaded ? 'Download again' : 'Download statement (PDF)'}
        </Button>
      </StepCard>

      <StepCard stepNumber={2} title="Confirm the name">
        <Field
          label={`Type "${affiliate.name}" to confirm`}
          error={
            form.formState.dirtyFields.confirmName
              ? form.formState.errors.confirmName?.message
              : undefined
          }
          hint={isStatementDownloaded ? undefined : 'Download the statement first.'}
        >
          <Input
            autoComplete="off"
            disabled={!isStatementDownloaded}
            invalid={
              !!form.formState.dirtyFields.confirmName && !!form.formState.errors.confirmName
            }
            {...form.register('confirmName')}
          />
        </Field>
      </StepCard>

      <div className="flex items-center justify-between gap-2">
        <BackButton onBack={onBack} />
        <Button
          type="submit"
          variant="destructive"
          loading={forceDeleteMutation.isPending}
          disabled={!canDelete || forceDeleteMutation.isPending}
        >
          <LuTrash2 className="size-4 me-1" /> Delete permanently
        </Button>
      </div>
    </form>
  );
}
