import type { FieldOption } from '#ui/components/Form/Form.types';

import type { FieldValidationOpts } from './buildFieldValidation.util';

import { buildFieldValidation } from './buildFieldValidation.util';

export type ChoiceFieldArgs<
  TValues extends Record<string, unknown>,
  T extends ChoiceFieldType,
> = FieldValidationOpts & {
  readonly accessor: keyof TValues & string;
  readonly description?: string;
  readonly label: string;
  readonly options: readonly FieldOption[];
  readonly type: T;
};

export type ChoiceFieldType = 'radio' | 'select';

/**
 * Build an options field (`select` or `radio`). Bakes the structural keys and
 * assembles `clientValidation` from flat rules. Bind `TValues` once via
 * `createFieldBuilders<TValues>()` so call sites need no explicit type
 * arguments.
 */
export const choiceField = <
  TValues extends Record<string, unknown>,
  T extends ChoiceFieldType,
>({
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
}: ChoiceFieldArgs<TValues, T>) => ({
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
