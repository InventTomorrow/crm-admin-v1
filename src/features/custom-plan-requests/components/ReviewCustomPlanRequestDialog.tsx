import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LuCopy, LuLoaderCircle } from 'react-icons/lu';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ControlledNumberInput } from '@/components/ui/controlled-number-input';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/features/auth/auth.hooks';
import { LEAD_PRICED_DURATION_LABEL } from '@/features/lead-pricing/lead-pricing.util';
import { usePlans } from '@/features/plans/plans.hooks';
import { formatDateTime } from '@/lib/format';
import { SystemPermissions } from '@/lib/permissions';
import { formatPlanPrice } from '@/lib/planFormat';
import type { CustomPlanRequest } from '../custom-plan-requests.api';
import {
  useApproveCustomPlanRequest,
  useRejectCustomPlanRequest,
} from '../custom-plan-requests.hooks';

const approveSchema = z.object({
  basePlanId: z.string().min(1, 'Pick a base plan'),
  price: z.number().min(0, 'Cannot be negative'),
  expiresInDays: z
    .number()
    .int('Whole days only')
    .min(1, 'At least 1 day')
    .max(90, 'At most 90 days'),
});
type ApproveFormValues = z.infer<typeof approveSchema>;

const rejectSchema = z.object({
  reason: z.string().trim().min(1, 'A reason is required').max(500),
});
type RejectFormValues = z.infer<typeof rejectSchema>;

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-default-500">{label}</p>
      <p className="mt-0.5 truncate text-sm text-default-800">{value}</p>
    </div>
  );
}

function CheckoutLinkPanel({ checkoutUrl }: { checkoutUrl: string }) {
  const copyCheckoutUrl = async () => {
    await navigator.clipboard.writeText(checkoutUrl);
    toast.success('Checkout link copied');
  };
  return (
    <div className="space-y-2 rounded-lg border border-default-200 bg-default-50 p-4">
      <p className="text-sm font-medium text-default-900">Checkout link</p>
      <div className="flex items-center gap-2">
        <Input readOnly value={checkoutUrl} className="font-mono text-xs" />
        <Button
          aria-label="Copy checkout link"
          size="icon"
          className="shrink-0"
          onClick={copyCheckoutUrl}
        >
          <LuCopy className="size-4" />
        </Button>
      </div>
      <p className="text-xs text-default-500">
        Send it to the customer. They pay and upload a receipt, which lands in User payments for
        approval.
      </p>
    </div>
  );
}

export function ReviewCustomPlanRequestDialog({
  request,
  open,
  onClose,
}: {
  request: CustomPlanRequest | null;
  open: boolean;
  onClose: () => void;
}) {
  const { can } = usePermissions();
  const canApprove =
    can(SystemPermissions.SUBSCRIPTION_REQUESTS_APPROVE) && can(SystemPermissions.PLANS_CREATE);
  const canReject = can(SystemPermissions.SUBSCRIPTION_REQUESTS_REJECT);
  const [isRejecting, setIsRejecting] = useState(false);
  const [approvedRequest, setApprovedRequest] = useState<CustomPlanRequest | null>(null);

  const approveMutation = useApproveCustomPlanRequest();
  const rejectMutation = useRejectCustomPlanRequest();
  const isPending = request?.status === 'PENDING' && !approvedRequest;

  const { data: catalogPlans = [] } = usePlans(
    { isTrial: 'false', isActive: 'true' },
    { enabled: open && isPending && canApprove }
  );
  const basePlanOptions = useMemo(
    () => catalogPlans.filter(plan => !plan.isCustom),
    [catalogPlans]
  );

  const approveForm = useForm<ApproveFormValues>({
    resolver: zodResolver(approveSchema),
    defaultValues: { basePlanId: '', price: 0, expiresInDays: 7 },
  });
  const rejectForm = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (!open || !request) return;
    setIsRejecting(false);
    setApprovedRequest(null);
    approveForm.reset({ basePlanId: '', price: request.quotedPrice, expiresInDays: 7 });
    rejectForm.reset({ reason: '' });
  }, [open, request, approveForm, rejectForm]);

  if (!request) return null;

  const displayedRequest = approvedRequest ?? request;
  const isBusy = approveMutation.isPending || rejectMutation.isPending;
  const { errors: approveErrors } = approveForm.formState;
  const { errors: rejectErrors } = rejectForm.formState;

  const submitApproval = approveForm.handleSubmit(values =>
    approveMutation.mutate({ id: request.id, input: values }, { onSuccess: setApprovedRequest })
  );
  const submitRejection = rejectForm.handleSubmit(values =>
    rejectMutation.mutate({ id: request.id, reason: values.reason }, { onSuccess: onClose })
  );

  return (
    <Modal
      open={open}
      onOpenChange={isOpen => !isOpen && onClose()}
      title="Custom plan request"
      size="lg"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
          <DetailField label="Customer" value={displayedRequest.customerName} />
          <DetailField
            label="Status"
            value={<Badge tone="neutral">{displayedRequest.status}</Badge>}
          />
          <DetailField label="Email" value={displayedRequest.customerEmail} />
          <DetailField label="Phone" value={displayedRequest.customerPhone} />
          {displayedRequest.businessName && (
            <DetailField label="Business" value={displayedRequest.businessName} />
          )}
          <DetailField label="Submitted" value={formatDateTime(displayedRequest.createdAt)} />
          {displayedRequest.plan && (
            <DetailField label="Plan created" value={displayedRequest.plan.name} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-default-200 p-4 sm:grid-cols-4">
          <DetailField
            label="Leads / month"
            value={displayedRequest.monthlyLeads.toLocaleString('en-PK')}
          />
          <DetailField
            label="Messages / month"
            value={displayedRequest.monthlyMessages.toLocaleString('en-PK')}
          />
          <DetailField
            label="Billing"
            value={LEAD_PRICED_DURATION_LABEL[displayedRequest.duration]}
          />
          <DetailField
            label="Quoted price"
            value={
              <span className="font-semibold text-primary">
                {formatPlanPrice(displayedRequest.quotedPrice, displayedRequest.currency)}
              </span>
            }
          />
          <p className="col-span-2 text-xs text-default-500 sm:col-span-4">
            Quoted at {formatPlanPrice(displayedRequest.pricePerLead, displayedRequest.currency)}{' '}
            per lead, {displayedRequest.messagesPerLead} messages per lead
            {displayedRequest.baseFee > 0 &&
              `, ${formatPlanPrice(displayedRequest.baseFee, displayedRequest.currency)} base fee per month`}
            {displayedRequest.discountPercent > 0 &&
              `, ${displayedRequest.discountPercent}% long-term discount`}
            .
          </p>
        </div>

        {displayedRequest.customerNote && (
          <div>
            <p className="text-xs text-default-500">Customer note</p>
            <p className="mt-0.5 whitespace-pre-line text-sm text-default-800">
              {displayedRequest.customerNote}
            </p>
          </div>
        )}

        {displayedRequest.checkoutUrl && (
          <CheckoutLinkPanel checkoutUrl={displayedRequest.checkoutUrl} />
        )}

        {displayedRequest.status === 'REJECTED' && displayedRequest.reviewNote && (
          <div>
            <p className="text-xs text-default-500">Rejection reason</p>
            <p className="mt-0.5 whitespace-pre-line text-sm text-default-800">
              {displayedRequest.reviewNote}
            </p>
          </div>
        )}

        {isPending && canApprove && !isRejecting && (
          <div className="space-y-4">
            <Field
              label="Base plan"
              hint="Its category, workspaces, seats, channels and catalogue limits are copied. Leads count across all of the customer's workspaces, so pick an all categories plan if they run more than one business type."
              error={approveErrors.basePlanId?.message}
            >
              <Select invalid={!!approveErrors.basePlanId} {...approveForm.register('basePlanId')}>
                <option value="">Pick a plan</option>
                {basePlanOptions.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.tier.toLowerCase()},{' '}
                    {plan.businessVertical
                      ? plan.businessVertical.replace(/_/g, ' ').toLowerCase()
                      : 'all categories'}
                    )
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={`Price to charge (${request.currency})`}
                hint="Defaults to the quote the customer saw."
                error={approveErrors.price?.message}
              >
                <ControlledNumberInput
                  control={approveForm.control}
                  name="price"
                  step="any"
                  invalid={!!approveErrors.price}
                />
              </Field>
              <Field label="Link valid for (days)" error={approveErrors.expiresInDays?.message}>
                <ControlledNumberInput
                  control={approveForm.control}
                  name="expiresInDays"
                  min={1}
                  invalid={!!approveErrors.expiresInDays}
                />
              </Field>
            </div>
          </div>
        )}

        {isPending && isRejecting && (
          <Field
            label="Why are you rejecting this?"
            hint="Kept for your records. The customer is not notified."
            error={rejectErrors.reason?.message}
          >
            <Textarea
              autoFocus
              rows={3}
              invalid={!!rejectErrors.reason}
              {...rejectForm.register('reason')}
            />
          </Field>
        )}

        {isPending && (canApprove || canReject) && (
          <div className="flex gap-2 pt-1">
            {isRejecting ? (
              <>
                <Button
                  variant="ghost"
                  className="flex-1"
                  disabled={isBusy}
                  onClick={() => setIsRejecting(false)}
                >
                  Back
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={isBusy}
                  onClick={submitRejection}
                >
                  {rejectMutation.isPending && (
                    <LuLoaderCircle className="size-4 me-1.5 animate-spin" />
                  )}
                  {rejectMutation.isPending ? 'Rejecting…' : 'Confirm rejection'}
                </Button>
              </>
            ) : (
              <>
                {canReject && (
                  <Button
                    variant="ghost"
                    className="flex-1"
                    disabled={isBusy}
                    onClick={() => setIsRejecting(true)}
                  >
                    Reject
                  </Button>
                )}
                {canApprove && (
                  <Button
                    variant="success"
                    className="flex-1"
                    disabled={isBusy}
                    onClick={submitApproval}
                  >
                    {approveMutation.isPending && (
                      <LuLoaderCircle className="size-4 me-1.5 animate-spin" />
                    )}
                    {approveMutation.isPending ? 'Creating…' : 'Create plan & checkout link'}
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {approvedRequest && (
          <Button className="w-full" onClick={onClose}>
            Done
          </Button>
        )}
      </div>
    </Modal>
  );
}
