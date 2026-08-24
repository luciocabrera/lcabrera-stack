import type { FieldClientValidation } from '#ui/components/Form/Form.types';

type ValidateNumberValueArgs = {
  readonly message: string;
  readonly validation: FieldClientValidation;
  readonly value: number;
};

export const validateNumberValue = ({
  message,
  validation,
  value,
}: ValidateNumberValueArgs) => {
  if (validation.min !== undefined && value < validation.min) return message;
  if (validation.max !== undefined && value > validation.max) return message;
};
