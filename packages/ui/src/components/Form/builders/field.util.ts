import type { FieldValidationOpts } from './buildFieldValidation.util';

import { buildFieldValidation } from './buildFieldValidation.util';

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
