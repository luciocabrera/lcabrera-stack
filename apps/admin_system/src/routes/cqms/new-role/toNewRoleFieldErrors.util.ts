import type { ZodError } from 'zod';

import type { NewRoleValues } from './newRole.schema';

type ToNewRoleFieldErrorsArgs = {
  readonly error: ZodError<NewRoleValues>;
};

/**
 * The per-field messages the create-role form renders. There is no description
 * entry: the field is a free-text `z.string().trim()` that cannot fail.
 */
export const toNewRoleFieldErrors = ({ error }: ToNewRoleFieldErrorsArgs) => {
  const fieldErrors = error.flatten().fieldErrors;

  return {
    permissionIds: fieldErrors.permissionIds?.[0],
    roleName: fieldErrors.roleName?.[0],
  };
};
