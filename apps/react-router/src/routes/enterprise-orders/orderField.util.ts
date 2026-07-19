import type { FieldValidationOpts } from './buildFieldValidation.util';
import type { EnterpriseOrderValues } from './config';

import { buildFieldValidation } from './buildFieldValidation.util';

/** Leaf field types built from the base field shape (no options/variant). */
export type OrderBaseFieldType =
  | 'currency'
  | 'date'
  | 'datetime'
  | 'email'
  | 'number'
  | 'password'
  | 'text'
  | 'textarea';

export type OrderFieldArgs<T extends OrderBaseFieldType> =
  FieldValidationOpts & {
    readonly accessor: keyof EnterpriseOrderValues;
    readonly description?: string;
    readonly disabled?: boolean;
    readonly label: string;
    readonly type: T;
  };

/**
 * Build a base leaf field (text/email/number/currency/date/textarea…). Bakes
 * the structural keys and assembles `clientValidation` from flat rules, so a
 * call carries only the field's distinctive data.
 */
export const orderField = <T extends OrderBaseFieldType>({
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
}: OrderFieldArgs<T>) => ({
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
