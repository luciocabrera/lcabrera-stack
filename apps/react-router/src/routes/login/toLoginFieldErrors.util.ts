import type { ZodError } from 'zod';

import type { LoginValues } from './login.schema';

type ToLoginFieldErrorsArgs = {
  readonly error: ZodError<LoginValues>;
};

export const toLoginFieldErrors = ({ error }: ToLoginFieldErrorsArgs) => {
  const { fieldErrors } = error.flatten();

  return {
    email: fieldErrors.email?.[0],
    password: fieldErrors.password?.[0],
  };
};
