import type { ChangeEventHandler } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface NotifyCustomerCheckboxProps {
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  description: string;
}

export function NotifyCustomerCheckbox({
  checked,
  onChange,
  description,
}: NotifyCustomerCheckboxProps) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-default-200 px-3 py-2.5">
      <Checkbox className="mt-0.5" checked={checked} onChange={onChange} />
      <span>
        <span className="block text-sm font-medium text-default-800">
          Notify the customer (in-app and email)
        </span>
        <span className="block text-xs text-default-500">{description}</span>
      </span>
    </label>
  );
}
