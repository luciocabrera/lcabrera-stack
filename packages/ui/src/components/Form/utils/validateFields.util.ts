import type {
  FieldErrors,
  LeafFieldDef,
} from '@lcabrera/ui/components/Form/Form.types';

import { validateField } from './validateField.util';

type ValidateFieldsArgs<TValues extends Record<string, unknown>> = {
  readonly leafFields: readonly LeafFieldDef<TValues>[];
  readonly values: TValues;
};

/**
 * Hand-rolled, non-Zod progressive-enhancement check for instant field
 * feedback only — the action's Zod parse on the server remains the
 * authoritative gate (see ADR-005 / TECH_SPEC §2.10).
 */
export const validateFields = <TValues extends Record<string, unknown>>({
  leafFields,
  values,
}: ValidateFieldsArgs<TValues>) => {
  const errors: FieldErrors<TValues> = {};

  for (const field of leafFields) {
    const error = validateField({ field, value: values[field.accessor] });
    if (error) {
      errors[field.accessor] = error;
    }
  }

  return errors;
};
