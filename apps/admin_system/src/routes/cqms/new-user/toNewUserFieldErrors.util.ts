import type { ZodError } from 'zod';

import type { NewUserValues } from './newUser.schema';

type ToNewUserFieldErrorsArgs = {
  readonly error: ZodError<NewUserValues>;
};

/** The per-field messages the create-user form renders under each input. */
export const toNewUserFieldErrors = ({ error }: ToNewUserFieldErrorsArgs) => {
  const fieldErrors = error.flatten().fieldErrors;

  return {
    displayName: fieldErrors.displayName?.[0],
    password: fieldErrors.password?.[0],
    roleIds: fieldErrors.roleIds?.[0],
    username: fieldErrors.username?.[0],
  };
};
