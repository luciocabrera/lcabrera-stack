import type { ZodError } from 'zod';

import type { EditRoleValues } from './editRole.schema';

type ToEditRoleFieldErrorsArgs = {
  readonly error: ZodError<EditRoleValues>;
};

/**
 * The per-field messages the edit-role form renders. `description` is also the
 * field the action surfaces a rejected update on, so it stays in the shape even
 * though validation itself cannot fail it.
 */
export const toEditRoleFieldErrors = ({ error }: ToEditRoleFieldErrorsArgs) => {
  const fieldErrors = error.flatten().fieldErrors;

  return {
    description: fieldErrors.description?.[0],
    permissionIds: fieldErrors.permissionIds?.[0],
  };
};
