import type { ReactNode } from 'react';

interface FieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/** Label + control + error/hint wrapper for every form control. */
export function Field({ label, htmlFor, required, error, hint, className, children }: FieldProps) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="form-label mb-2 block text-sm font-medium text-default-700"
        >
          {label}
          {required && <span className="ms-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-sm text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-default-400">{hint}</p>
      )}
    </div>
  );
}
