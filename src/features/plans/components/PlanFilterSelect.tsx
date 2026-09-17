import { Select } from '@/components/ui/select';
import { usePlans } from '../plans.hooks';

interface PlanFilterSelectProps {
  /** 'ALL' when not filtering. */
  value: string;
  onChange: (planId: string) => void;
  className?: string;
}

/** Plan dropdown for list toolbars. Reads the full catalogue, never a page of it. */
export function PlanFilterSelect({
  value,
  onChange,
  className = 'form-input-sm w-44',
}: PlanFilterSelectProps) {
  const { data: plans = [] } = usePlans();

  return (
    <Select
      value={value}
      onChange={event => onChange(event.target.value)}
      className={className}
      aria-label="Filter by plan"
    >
      <option value="ALL">All plans</option>
      {plans.map(plan => (
        <option key={plan.id} value={plan.id}>
          {plan.name}
        </option>
      ))}
    </Select>
  );
}
