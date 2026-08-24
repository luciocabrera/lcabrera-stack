import type { FieldClientValidation } from '#ui/components/Form/Form.types';

type ValidateStringValueArgs = {
  readonly message: string;
  readonly validation: FieldClientValidation;
  readonly value: string;
};

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
};
