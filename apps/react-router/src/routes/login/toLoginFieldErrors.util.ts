import type { ZodError } from 'zod';

import type { LoginValues } from './login.schema';

type ToLoginFieldErrorsArgs = {
  readonly error: ZodError<LoginValues>;
};

/**
 * Flattens a Zod validation error into the per-field message map the login
 * Form renders under each input (first message per field). The shape is
 * structurally compatible with the Form's `serverErrors` prop. Pure.
 */
export const toLoginFieldErrors = ({ error }: ToLoginFieldErrorsArgs) => {
  const { fieldErrors } = error.flatten();

  return {
    email: fieldErrors.email?.[0],
    password: fieldErrors.password?.[0],
  };
};
