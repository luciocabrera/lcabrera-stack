import type { FieldClientValidation } from '@repo/ui/components/Form/Form.types';

type ValidateStringValueArgs = {
  readonly message: string;
  readonly validation: FieldClientValidation;
  readonly value: string;
};

/**
 * Validates a string value against the `minLength`, `maxLength`, and `pattern`
 * client-validation rules. Returns the shared `message` on the first failing
 * rule, or `undefined` when the value satisfies every configured constraint.
 */
export const validateStringValue = ({
  message,
  validation,
  value,
}: ValidateStringValueArgs) => {
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
  if (validation.pattern && !validation.pattern.test(value)) {
    return message;
  }
  return;
};
