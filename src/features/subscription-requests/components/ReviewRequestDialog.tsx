import { useEffect, useState, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LuExternalLink, LuLoaderCircle } from 'react-icons/lu';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import type { SearchSelectOption } from '@/components/ui/search-select';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { useCanWrite } from '@/features/auth/auth.hooks';
import { CrmUserSearchSelect } from '@/features/users/components/CrmUserSearchSelect';
import { formatDateTime } from '@/lib/format';
import { formatPlanPrice } from '@/lib/planFormat';
import type { SubscriptionRequest } from '../requests.api';
import { useApproveRequest, useRejectRequest } from '../requests.hooks';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';

const rejectSchema = z.object({
  reason: z.string().min(1, 'A reason is required'),
});
type RejectFormValues = z.infer<typeof rejectSchema>;

/**
 * What the plan costs, side by side with what the customer says they sent.
 * The claimed amount is customer-typed, so approving on it alone is how an
 * underpayment gets activated at full price — the shortfall has to be on
 * screen at the moment of approval, not buried in the receipt image.
 */
function PaymentReconciliation({ request }: { request: SubscriptionRequest }) {
  const { plan } = request;
  if (!plan) return null;

  const shortfall = plan.price - request.paymentAmount;
  const currencyMismatch = plan.currency !== request.currency;
  const settled = shortfall <= 0 && !currencyMismatch;

  return (
    <div
      className={`mb-4 rounded-lg border p-3 ${
        settled ? 'border-default-200 bg-default-50' : 'border-warning/40 bg-warning/15'
      }`}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-default-500">Plan price</span>
        <span className="font-medium text-default-800">
          {formatPlanPrice(plan.price, plan.currency)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between text-sm">
        <span className="text-default-500">Customer paid</span>
        <span className="font-medium text-default-800">
          {formatPlanPrice(request.paymentAmount, request.currency)}
        </span>
      </div>
      {!settled && (
        <p className="mt-2 text-xs font-medium text-warning">
          {currencyMismatch
            ? `Currency mismatch — plan is billed in ${plan.currency}, customer paid in ${request.currency}.`
            : `Short by ${formatPlanPrice(shortfall, plan.currency)} — verify the receipt before approving.`}
        </p>
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-default-500">{label}</p>
      <div className="mt-0.5 text-sm text-default-800">{value}</div>
    </div>
  );
}

/**
 * Review a customer-submitted (workflow 2) request: check the uploaded
 * receipt, then approve — which activates the subscription — or reject with a
 * reason, which reopens their checkout link for another attempt.
 */
export function ReviewRequestDialog({
  request,
  open,
  onClose,
}: {
  request: SubscriptionRequest | null;
  open: boolean;
  onClose: () => void;
}) {
  const canWrite = useCanWrite();
  const [selectedOwner, setSelectedOwner] = useState<SearchSelectOption | null>(null);
  // Two-step reject: the reason field only appears after choosing Reject.
  const [rejecting, setRejecting] = useState(false);

  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();

  const rejectForm = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' },
  });

  // A request from a link with no CRM account attached needs one chosen at
  // approval time; otherwise the account is already known.
  const needsOwner = !!request && !request.ownerUserId;

  useEffect(() => {
    if (open) {
      setSelectedOwner(null);
      setRejecting(false);
      rejectForm.reset();
    }
  }, [open, request?.id, rejectForm]);

  if (!request) return null;

  const pending = request.status === 'PENDING_APPROVAL';
  const busy = approveMutation.isPending || rejectMutation.isPending;
  const showActions = pending && canWrite;

  return (
    <Modal
      open={open}
      onOpenChange={isOpen => !isOpen && onClose()}
      title="Review subscription request"
      size="lg"
    >
      <p className="mb-4 text-sm text-default-500">
        {request.plan?.name ?? 'Plan'} · {formatPlanPrice(request.paymentAmount, request.currency)}{' '}
        claimed via {request.paymentMethod.replace(/_/g, ' ').toLowerCase()}
      </p>

      <PaymentReconciliation request={request} />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
          <DetailField label="Customer" value={request.customerName} />
          <DetailField
            label="Status"
            value={<Badge tone="neutral">{request.status.replace(/_/g, ' ')}</Badge>}
          />
          <DetailField label="Email" value={request.customerEmail} />
          <DetailField label="Phone" value={request.customerPhone} />
          {request.businessName && <DetailField label="Business" value={request.businessName} />}
          <DetailField label="Account" value={request.owner?.email ?? '— not linked —'} />
          {request.paymentReference && (
            <DetailField label="Reference" value={request.paymentReference} />
          )}
          <DetailField label="Submitted" value={formatDateTime(request.createdAt)} />
        </div>

        {request.customerNote && (
          <div>
            <p className="text-xs text-default-500">Customer note</p>
            <p className="mt-0.5 whitespace-pre-line text-sm text-default-800">
              {request.customerNote}
            </p>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-xs text-default-500">Payment receipt</p>
          {request.receiptUrl ? (
            <a
              href={request.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <LuExternalLink className="size-4 me-1" /> Open receipt
            </a>
          ) : (
            // Free/trial plans are submitted without one.
            <p className="text-xs text-default-500">No receipt — this plan is free.</p>
          )}
        </div>

        {showActions && needsOwner && (
          <Field
            label="Assign to CRM account"
            hint="This request came from a link with no CRM account attached."
          >
            <CrmUserSearchSelect
              value={selectedOwner}
              onSelect={setSelectedOwner}
              enabled={open && needsOwner}
            />
          </Field>
        )}

        {/* Only asked once the admin actually chooses to reject, so the
            approve path isn't cluttered by a field it never needs. */}
        {showActions && rejecting && (
          <Field
            label="Why are you rejecting this?"
            hint="Their checkout link reopens so they can try again."
            error={rejectForm.formState.errors.reason?.message}
          >
            <Textarea
              autoFocus
              rows={3}
              placeholder="e.g. receipt unreadable, amount doesn't match"
              invalid={!!rejectForm.formState.errors.reason}
              {...rejectForm.register('reason')}
            />
          </Field>
        )}

        {!pending && request.reviewNote && (
          <div>
            <p className="text-xs text-default-500">Review note</p>
            <p className="mt-0.5 whitespace-pre-line text-sm text-default-800">
              {request.reviewNote}
            </p>
          </div>
        )}

        {showActions && (
          <div className="flex gap-2 pt-2">
            {rejecting ? (
              <>
                <Button
                  variant="ghost"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => {
                    setRejecting(false);
                    rejectForm.reset();
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={busy}
                  onClick={rejectForm.handleSubmit(values =>
                    rejectMutation.mutate(
                      { id: request.id, reason: values.reason.trim() },
                      { onSuccess: onClose }
                    )
                  )}
                >
                  {rejectMutation.isPending && (
                    <LuLoaderCircle className="size-4 me-1.5 animate-spin" />
                  )}
                  {rejectMutation.isPending ? 'Rejecting…' : 'Confirm rejection'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => setRejecting(true)}
                >
                  Reject
                </Button>
                <Button
                  variant="success"
                  className="flex-1"
                  disabled={busy || (needsOwner && !selectedOwner)}
                  onClick={() =>
                    approveMutation.mutate(
                      {
                        id: request.id,
                        ...(selectedOwner ? { ownerUserId: selectedOwner.id } : {}),
                      },
                      { onSuccess: onClose }
                    )
                  }
                >
                  {approveMutation.isPending && (
                    <LuLoaderCircle className="size-4 me-1.5 animate-spin" />
                  )}
                  {approveMutation.isPending ? 'Approving…' : 'Approve & activate'}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
