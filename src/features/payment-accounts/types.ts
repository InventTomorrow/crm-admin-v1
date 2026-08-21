import { z } from 'zod';

/** Mirrors PAYMENT_METHODS in server/src/modules/admin/subscriptions/subscriptions.dto.ts. */
export const PAYMENT_METHODS = ['BANK_TRANSFER', 'EASYPAISA', 'JAZZCASH', 'CASH', 'OTHER'] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Bank transfer',
  EASYPAISA: 'Easypaisa',
  JAZZCASH: 'JazzCash',
  CASH: 'Cash',
  OTHER: 'Other',
};

/** A bank / wallet account, as the admin API returns it. */
export interface PaymentAccount {
  id: string;
  label: string;
  method: PaymentMethod;
  accountTitle: string;
  accountNumber: string;
  bankName: string | null;
  iban: string | null;
  branchCode: string | null;
  instructions: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Names — letters, digits, spaces and the punctuation business names actually use. */
const NAME_PATTERN = /^[A-Za-z0-9 &.,'()\-/]+$/;
/** Bank accounts are digits, optionally grouped by spaces or hyphens. */
const BANK_ACCOUNT_PATTERN = /^\d(?:[\d -]*\d)?$/;
/** Easypaisa / JazzCash wallets are Pakistani mobile numbers. */
const PK_MOBILE_PATTERN = /^(?:\+92|0)3\d{2}[ -]?\d{7}$/;
/** Cash / other — a free-form handle. */
const HANDLE_PATTERN = /^[A-Za-z0-9@.\-_/ ]+$/;
const IBAN_PATTERN = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;
const BRANCH_CODE_PATTERN = /^\d{2,10}$/;

const countDigits = (value: string): number => (value.match(/\d/g) ?? []).length;

/** Spaces stripped and upper-cased, the form the server stores. */
export const normalizeIban = (value: string): string => value.replace(/\s+/g, '').toUpperCase();

/** The number's shape follows the method — a wallet is a phone number, a bank account is not. */
function isAccountNumberValidForMethod(method: PaymentMethod, accountNumber: string): boolean {
  if (method === 'BANK_TRANSFER') {
    const digits = countDigits(accountNumber);
    return BANK_ACCOUNT_PATTERN.test(accountNumber) && digits >= 6 && digits <= 24;
  }
  if (method === 'EASYPAISA' || method === 'JAZZCASH') return PK_MOBILE_PATTERN.test(accountNumber);
  return HANDLE_PATTERN.test(accountNumber) && accountNumber.trim().length >= 3;
}

const ACCOUNT_NUMBER_MESSAGE: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Account number must be 6–24 digits — spaces and hyphens allowed, letters are not',
  EASYPAISA: 'Enter the wallet mobile number, e.g. 03001234567',
  JAZZCASH: 'Enter the wallet mobile number, e.g. 03001234567',
  CASH: 'Use letters, digits and @ . - _ / only',
  OTHER: 'Use letters, digits and @ . - _ / only',
};

/**
 * Mirrors the server's createPaymentAccountSchema — same patterns, same
 * messages. Optional fields arrive as '' rather than null here, since the form
 * inputs stay controlled; the submit handler converts them.
 */
export const paymentAccountSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(2, 'Label must be at least 2 characters')
      .max(80, 'Label must be 80 characters or fewer')
      .regex(NAME_PATTERN, 'Label contains unsupported characters')
      .refine(value => /[A-Za-z]/.test(value), 'Label must contain letters'),
    method: z.enum(PAYMENT_METHODS),
    accountTitle: z
      .string()
      .trim()
      .min(2, 'Account title must be at least 2 characters')
      .max(120, 'Account title must be 120 characters or fewer')
      .regex(NAME_PATTERN, 'Account title contains unsupported characters')
      .refine(value => /[A-Za-z]/.test(value), 'Account title must contain letters'),
    // Shape checked against `method` in the superRefine below.
    accountNumber: z
      .string()
      .trim()
      .min(3, 'Account number must be at least 3 characters')
      .max(60, 'Account number must be 60 characters or fewer'),
    bankName: z
      .string()
      .trim()
      .max(120, 'Bank name must be 120 characters or fewer')
      .refine(value => value === '' || value.length >= 2, 'Bank name must be at least 2 characters')
      .refine(
        value => value === '' || NAME_PATTERN.test(value),
        'Bank name contains unsupported characters'
      ),
    iban: z
      .string()
      .trim()
      .max(40, 'IBAN must be 40 characters or fewer')
      .refine(
        value => value === '' || IBAN_PATTERN.test(normalizeIban(value)),
        'Enter a valid IBAN, e.g. PK36SCBL0000001123456702'
      ),
    branchCode: z
      .string()
      .trim()
      .refine(
        value => value === '' || BRANCH_CODE_PATTERN.test(value),
        'Branch code must be 2–10 digits'
      ),
    instructions: z
      .string()
      .trim()
      .max(500, 'Note must be 500 characters or fewer')
      .refine(value => value === '' || value.length >= 5, 'Note must be at least 5 characters'),
    isActive: z.boolean(),
    sortOrder: z
      .number({ message: 'Enter a display order' })
      .int('Display order must be a whole number')
      .min(0, 'Display order cannot be negative')
      .max(999, 'Display order must be 999 or less'),
  })
  .superRefine((values, ctx) => {
    if (isAccountNumberValidForMethod(values.method, values.accountNumber)) return;
    ctx.addIssue({
      code: 'custom',
      path: ['accountNumber'],
      message: ACCOUNT_NUMBER_MESSAGE[values.method],
    });
  });

export type PaymentAccountFormValues = z.infer<typeof paymentAccountSchema>;

/** Payload shape both create and update take — empty optionals become null. */
export interface PaymentAccountInput {
  label: string;
  method: PaymentMethod;
  accountTitle: string;
  accountNumber: string;
  bankName: string | null;
  iban: string | null;
  branchCode: string | null;
  instructions: string | null;
  isActive: boolean;
  sortOrder: number;
}
