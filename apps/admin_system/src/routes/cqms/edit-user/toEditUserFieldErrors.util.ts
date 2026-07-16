import type { ZodError } from 'zod';

import type { EditUserValues } from './editUser.schema';

type ToEditUserFieldErrorsArgs = {
  readonly error: ZodError<EditUserValues>;
};

/**
 * The per-field messages the edit-user form renders. There is no username here —
 * it is immutable (ADR-024), so editing cannot fail on it.
 */
export const toEditUserFieldErrors = ({ error }: ToEditUserFieldErrorsArgs) => {
  const fieldErrors = error.flatten().fieldErrors;

  return {
    displayName: fieldErrors.displayName?.[0],
    newPassword: fieldErrors.newPassword?.[0],
    roleIds: fieldErrors.roleIds?.[0],
  };
};
