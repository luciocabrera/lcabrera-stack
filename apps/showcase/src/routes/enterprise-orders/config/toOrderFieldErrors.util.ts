import type { FieldErrors } from '@lcabrera/ui/components/Form';
import type { ZodError } from 'zod';

import type { EnterpriseOrderInput } from './enterpriseOrders.schema';
import type { EnterpriseOrderValues } from './enterpriseOrders.types';

export type ToOrderFieldErrorsArgs = {
  readonly error: ZodError<EnterpriseOrderInput>;
};

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
