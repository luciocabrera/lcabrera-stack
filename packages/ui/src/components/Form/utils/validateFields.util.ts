import type { FieldErrors, LeafFieldDef } from '#ui/components/Form/Form.types';

import { validateField } from './validateField.util';

type ValidateFieldsArgs<TValues extends Record<string, unknown>> = {
  readonly leafFields: readonly LeafFieldDef<TValues>[];
  readonly values: TValues;
};

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
