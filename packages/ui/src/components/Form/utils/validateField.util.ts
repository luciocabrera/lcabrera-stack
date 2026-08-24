import type { LeafFieldDef } from '#ui/components/Form/Form.types';

import { validateNumberValue } from './validateNumberValue.util';
import { validateStringValue } from './validateStringValue.util';

type ValidateFieldArgs<TValues extends Record<string, unknown>> = {
  readonly field: LeafFieldDef<TValues>;
  readonly value: unknown;
};

export const validateField = <TValues extends Record<string, unknown>>({
  field,
  value,
}: ValidateFieldArgs<TValues>) => {
  const validation = field.clientValidation;
  if (!validation) return;

  const message = validation.message ?? `${field.label} is invalid.`;
  const isEmpty =
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);

  if (isEmpty && validation.required) {
    return validation.message ?? `${field.label} is required.`;
  }

  if (isEmpty) return;

  if (typeof value === 'string') {
    return validateStringValue({ message, validation, value });
  }

  if (typeof value === 'number') {
    return validateNumberValue({ message, validation, value });
  }
};
