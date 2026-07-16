import type { ZodError } from 'zod';

import type { LoginValues } from './login.schema';

type ToLoginFieldErrorsArgs = {
  readonly error: ZodError<LoginValues>;
};

/** The per-field messages the login form renders under each input. */
export const toLoginFieldErrors = ({ error }: ToLoginFieldErrorsArgs) => {
  const fieldErrors = error.flatten().fieldErrors;

  return {
    password: fieldErrors.password?.[0],
    username: fieldErrors.username?.[0],
  };
};
