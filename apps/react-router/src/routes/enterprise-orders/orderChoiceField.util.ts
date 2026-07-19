import type { FieldOption } from '@repo/ui/components/Form/Form.types';

import type { FieldValidationOpts } from './buildFieldValidation.util';
import type { EnterpriseOrderValues } from './config';

import { buildFieldValidation } from './buildFieldValidation.util';

export type OrderChoiceFieldArgs<T extends 'radio' | 'select'> =
  FieldValidationOpts & {
    readonly accessor: keyof EnterpriseOrderValues;
    readonly description?: string;
    readonly label: string;
    readonly options: readonly FieldOption[];
    readonly type: T;
  };

/**
 * Build an options field (`select` or `radio`). Bakes the structural keys and
 * assembles `clientValidation` from flat rules.
 */
export const orderChoiceField = <T extends 'radio' | 'select'>({
  accessor,
  description,
  label,
  max,
  maxLength,
  min,
  minLength,
  options,
  pattern,
  required,
  type,
}: OrderChoiceFieldArgs<T>) => ({
  accessor,
  label,
  options,
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
});
