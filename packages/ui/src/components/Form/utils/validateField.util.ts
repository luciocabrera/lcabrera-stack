import type { LeafFieldDef } from '@repo/ui/components/Form/Form.types';

import { validateNumberValue } from './validateNumberValue.util';
import { validateStringValue } from './validateStringValue.util';

type ValidateFieldArgs<TValues extends Record<string, unknown>> = {
  readonly field: LeafFieldDef<TValues>;
  readonly value: unknown;
};

/**
 * Validates a single leaf field's value against its `clientValidation` rules,
 * delegating type-specific checks to `validateStringValue`/`validateNumberValue`.
 * Returns the first error message, or `undefined` when the value is valid (or
 * the field has no client validation).
 */
export const validateField = <TValues extends Record<string, unknown>>({
  field,
  value,
}: ValidateFieldArgs<TValues>): string | undefined => {
  const validation = field.clientValidation;
  if (!validation) return undefined;

  const message = validation.message ?? `${field.label} is invalid.`;
  const isEmpty =
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);

  if (validation.required && isEmpty) {
    return validation.message ?? `${field.label} is required.`;
  }

  if (isEmpty) return undefined;

  if (typeof value === 'string') {
    return validateStringValue({ message, validation, value });
  }

  if (typeof value === 'number') {
    return validateNumberValue({ message, validation, value });
  }

  return undefined;
};
