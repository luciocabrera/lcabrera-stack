import type { FieldValidationOpts } from './buildFieldValidation.util';

import { buildFieldValidation } from './buildFieldValidation.util';

/** Leaf field types built from the base field shape (no options/variant). */
export type BaseFieldType =
  | 'currency'
  | 'date'
  | 'datetime'
  | 'email'
  | 'number'
  | 'password'
  | 'text'
  | 'textarea';

export type FieldArgs<
  TValues extends Record<string, unknown>,
  T extends BaseFieldType,
> = FieldValidationOpts & {
  readonly accessor: keyof TValues & string;
  readonly description?: string;
  readonly disabled?: boolean;
  readonly label: string;
  readonly type: T;
};

/**
 * Build a base leaf field (text/email/number/currency/date/textarea…). Bakes
 * the structural keys and assembles `clientValidation` from flat rules, so a
 * call carries only the field's distinctive data. `TValues` is the Form's
 * value shape — bind it once via `createFieldBuilders<TValues>()` so call sites
 * need no explicit type arguments.
 */
export const field = <
  TValues extends Record<string, unknown>,
  T extends BaseFieldType,
>({
  accessor,
  description,
  disabled,
  label,
  max,
  maxLength,
  min,
  minLength,
  pattern,
  required,
  type,
}: FieldArgs<TValues, T>) => ({
  accessor,
  label,
  type,
  ...buildFieldValidation({
    max,
    maxLength,
    min,
    minLength,
    pattern,
    required,
  }),
  ...(description !== undefined && { description }),
  ...(disabled !== undefined && { disabled }),
});
