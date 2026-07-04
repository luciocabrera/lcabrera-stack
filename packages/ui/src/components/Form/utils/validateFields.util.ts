import type {
  FieldErrors,
  LeafFieldDef,
} from '@repo/ui/components/Form/Form.types';

const validateField = <TValues extends Record<string, unknown>>(
  field: LeafFieldDef<TValues>,
  value: unknown,
): string | undefined => {
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
    if (
      validation.minLength !== undefined &&
      value.length < validation.minLength
    ) {
      return message;
    }
    if (
      validation.maxLength !== undefined &&
      value.length > validation.maxLength
    ) {
      return message;
    }
    if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
      return message;
    }
  }

  if (typeof value === 'number') {
    if (validation.min !== undefined && value < validation.min) return message;
    if (validation.max !== undefined && value > validation.max) return message;
  }

  return undefined;
};

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
}: ValidateFieldsArgs<TValues>): FieldErrors<TValues> => {
  const errors: FieldErrors<TValues> = {};

  for (const field of leafFields) {
    const error = validateField(field, values[field.accessor]);
    if (error) {
      errors[field.accessor] = error;
    }
  }

  return errors;
};
