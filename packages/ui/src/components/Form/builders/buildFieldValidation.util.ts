import type { FieldClientValidation } from '@lcabrera/ui/components/Form/Form.types';

export type FieldValidationOpts = {
  readonly max?: number;
  readonly maxLength?: number;
  readonly min?: number;
  readonly minLength?: number;
  readonly pattern?: RegExp;
  readonly required?: boolean;
};

/**
 * Assemble a Form `clientValidation` object from flat validation options,
 * dropping every unset key. Returns `{ clientValidation }` only when at least
 * one rule is present, so a field with no validation carries no
 * `clientValidation` key at all (matching a hand-written field literal).
 */
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
