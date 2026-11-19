import { AnimatePresence, motion } from 'framer-motion';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import type { AffiliateFormValues } from '../../affiliate-form.schema';
import { DiscountPercentPicker } from '../shared/DiscountPercentPicker';

const DEFAULT_SELF_SERVE_DISCOUNT_PERCENT = 10;

/** Null means not allowed; ticking the box starts the cap at a sensible default. */
export function SelfServeCodesField({ form }: { form: UseFormReturn<AffiliateFormValues> }) {
  return (
    <Controller
      control={form.control}
      name="selfServeMaxDiscountPercent"
      render={({ field, fieldState }) => {
        const isAllowed = field.value !== null;
        return (
          <div className="rounded-lg border border-default-200 p-3">
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                className="mt-0.5"
                checked={isAllowed}
                onChange={event =>
                  field.onChange(event.target.checked ? DEFAULT_SELF_SERVE_DISCOUNT_PERCENT : null)
                }
              />
              <span>
                <span className="block text-sm font-medium text-default-800">
                  Allow them to create their own referral codes
                </span>
                <span className="block text-xs text-default-500">
                  They make codes from their dashboard, up to 10 at a time. You can still pause or
                  delete any of them.
                </span>
              </span>
            </label>

            <AnimatePresence initial={false}>
              {isAllowed && (
                <motion.div
                  key="self-serve-cap"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-3">
                    <Field
                      label="Highest discount they can give"
                      error={fieldState.error?.message}
                      hint="Each code they create can give any discount from 1% up to this."
                    >
                      <DiscountPercentPicker
                        value={field.value ?? DEFAULT_SELF_SERVE_DISCOUNT_PERCENT}
                        onChange={field.onChange}
                        invalid={!!fieldState.error}
                      />
                    </Field>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }}
    />
  );
}
