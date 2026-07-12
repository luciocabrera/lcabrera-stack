import type { FieldClientValidation } from '@repo/ui/components/Form/Form.types';

type ValidateNumberValueArgs = {
  readonly message: string;
  readonly validation: FieldClientValidation;
  readonly value: number;
};

/**
 * Validates a number value against the `min` and `max` client-validation
 * rules. Returns the shared `message` on the first failing rule, or
 * `undefined` when the value satisfies every configured constraint.
 */
export const validateNumberValue = ({
  message,
  validation,
  value,
}: ValidateNumberValueArgs) => {
  if (validation.min !== undefined && value < validation.min) return message;
  if (validation.max !== undefined && value > validation.max) return message;
  return undefined;
};
