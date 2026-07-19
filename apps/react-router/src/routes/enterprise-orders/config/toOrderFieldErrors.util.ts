import type { FieldErrors } from '@repo/ui/components/Form';
import type { ZodError } from 'zod';

import type { EnterpriseOrderInput } from './enterpriseOrders.schema';
import type { EnterpriseOrderValues } from './enterpriseOrders.types';

export type ToOrderFieldErrorsArgs = {
  readonly error: ZodError<EnterpriseOrderInput>;
};

/**
 * Turn a `ZodError` from `enterpriseOrderSchema` into the per-field message map
 * the Form renders under each input — the first message per field. Every key
 * produced is a schema field (a subset of the Form's value keys), so the
 * result is a valid `FieldErrors<EnterpriseOrderValues>`.
 */
export const toOrderFieldErrors = ({
  error,
}: ToOrderFieldErrorsArgs): FieldErrors<EnterpriseOrderValues> => {
  const { fieldErrors } = error.flatten();

  return Object.fromEntries(
    Object.entries(fieldErrors).flatMap(([key, messages]) => {
      const first = messages?.[0];

      return first === undefined ? [] : [[key, first]];
    }),
  );
};
