import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Input } from './input';

interface ControlledNumberInputProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  placeholder?: string;
  min?: string | number;
  step?: string | number;
  className?: string;
  invalid?: boolean;
  disabled?: boolean;
}

/**
 * Numeric field bound to a required `number` RHF field, displayed empty (showing
 * `placeholder`) instead of a literal "0" — so typing a real value doesn't start
 * with selecting-and-deleting a zero. An empty field still submits as 0.
 */
export function ControlledNumberInput<TFieldValues extends FieldValues>({
  control,
  name,
  placeholder = '0',
  min = '0',
  step,
  className,
  invalid,
  disabled,
}: ControlledNumberInputProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Input
          type="number"
          min={min}
          step={step}
          placeholder={placeholder}
          className={className}
          invalid={invalid}
          disabled={disabled}
          name={field.name}
          value={
            field.value === 0 || field.value === undefined || field.value === null
              ? ''
              : field.value
          }
          onBlur={field.onBlur}
          onChange={event => {
            const parsed = event.target.valueAsNumber;
            field.onChange(Number.isNaN(parsed) ? 0 : parsed);
          }}
        />
      )}
    />
  );
}
