import type { FieldClientValidation } from '#ui/components/Form/Form.types';

export type FieldValidationOpts = {
  readonly max?: number;
  readonly maxLength?: number;
  readonly min?: number;
  readonly minLength?: number;
  readonly pattern?: RegExp;
  readonly required?: boolean;
};

export const buildFieldValidation = ({
  max,
  maxLength,
  min,
  minLength,
  pattern,
  required,
}: FieldValidationOpts): {
  readonly clientValidation?: FieldClientValidation;
} => {
  const clientValidation: FieldClientValidation = {
    ...(max !== undefined && { max }),
    ...(maxLength !== undefined && { maxLength }),
    ...(min !== undefined && { min }),
    ...(minLength !== undefined && { minLength }),
    ...(pattern !== undefined && { pattern }),
    ...(required !== undefined && { required }),
  };

  return Object.keys(clientValidation).length > 0 ? { clientValidation } : {};
};
