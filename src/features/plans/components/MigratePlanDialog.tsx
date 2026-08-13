import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import type { Plan } from '@/lib/types';
import { usePlanActiveSubscribers, useMigrateSubscribers } from '../plans.hooks';

interface MigratePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourcePlan: Plan | null;
  plans: Plan[];
}

/** Moves every (or a chosen set of) active/trialing subscriber off `sourcePlan` onto another plan — used to clear a plan before deleting it. */
export function MigratePlanDialog({ open, onOpenChange, sourcePlan, plans }: MigratePlanDialogProps) {
  const targetOptions = useMemo(
    () => plans.filter(plan => plan.id !== sourcePlan?.id),
    [plans, sourcePlan]
  );
  const [targetPlanId, setTargetPlanId] = useState('');
  const [mode, setMode] = useState<'all' | 'selected'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const subscribersQuery = usePlanActiveSubscribers(sourcePlan?.id ?? '', open && !!sourcePlan);
  const subscribers = subscribersQuery.data ?? [];
  const migrateMutation = useMigrateSubscribers(sourcePlan?.id ?? '');

  useEffect(() => {
    if (!open) return;
    setTargetPlanId('');
    setMode('all');
    setSelectedIds(new Set());
  }, [open, sourcePlan?.id]);

  if (!sourcePlan) return null;

  const toggleSelected = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = mode === 'all' ? subscribers.length : selectedIds.size;
  const canMigrate = !!targetPlanId && selectedCount > 0 && !migrateMutation.isPending;

  const handleMigrate = () => {
    if (!targetPlanId) return;
    migrateMutation.mutate(
      {
        targetPlanId,
        subscriptionIds: mode === 'selected' ? Array.from(selectedIds) : undefined,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Move subscribers off "${sourcePlan.name}"`}
      size="lg"
      footer={
        <>
          <Button variant="soft" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMigrate} disabled={!canMigrate} loading={migrateMutation.isPending}>
            Move {selectedCount > 0 ? selectedCount : ''} subscriber{selectedCount === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Move to plan">
          <Select value={targetPlanId} onChange={e => setTargetPlanId(e.target.value)}>
            <option value="">Select a plan…</option>
            {targetOptions.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Who moves">
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="migrate-mode"
                checked={mode === 'all'}
                onChange={() => setMode('all')}
              />
              All subscribers ({subscribers.length})
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="migrate-mode"
                checked={mode === 'selected'}
                onChange={() => setMode('selected')}
              />
              Select individually
            </label>
          </div>
        </Field>

        {subscribersQuery.isLoading ? (
          <p className="text-sm text-default-500">Loading subscribers…</p>
        ) : subscribers.length === 0 ? (
          <p className="text-sm text-default-500">
            No active subscribers on this plan.
            {(sourcePlan.totalSubscriberCount ?? 0) > 0 &&
              ` Its ${sourcePlan.totalSubscriberCount} subscription record(s) are cancelled or expired and stay with the plan.`}
          </p>
        ) : mode === 'selected' ? (
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-default-200 p-2">
            {subscribers.map(sub => (
              <label
                key={sub.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-default-100"
              >
                <Checkbox checked={selectedIds.has(sub.id)} onChange={() => toggleSelected(sub.id)} />
                <span className="flex-1 truncate">
                  {[sub.owner.firstName, sub.owner.lastName].filter(Boolean).join(' ') || sub.owner.email}
                </span>
                <span className="text-xs text-default-400">{sub.owner.email}</span>
              </label>
            ))}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
