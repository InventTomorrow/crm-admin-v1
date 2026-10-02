import { useMutationState, type MutationKey } from '@tanstack/react-query';
import { LuLoaderCircle } from 'react-icons/lu';

interface RowPendingIndicatorProps {
  mutationKey: MutationKey;
  rowId: string;
  label?: string;
}

/** Spinner for a table row while a mutation under `mutationKey` is running on it. */
export function RowPendingIndicator({
  mutationKey,
  rowId,
  label = 'Deleting',
}: RowPendingIndicatorProps) {
  const pendingVariables = useMutationState({
    filters: { mutationKey, status: 'pending' },
    select: mutation => mutation.state.variables,
  });
  // Single-row mutations take the id; bulk ones take an id list.
  const isRowPending = pendingVariables.some(
    variables => variables === rowId || (Array.isArray(variables) && variables.includes(rowId))
  );

  if (!isRowPending) return null;
  return (
    <LuLoaderCircle
      role="status"
      aria-label={label}
      className="size-4 shrink-0 animate-spin text-default-400"
    />
  );
}
