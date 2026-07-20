import { createRole } from '@repo/scan-ingestion/queries/createRole.util';
import { replaceRolePermissions } from '@repo/scan-ingestion/queries/replaceRolePermissions.util';
import { getErrorMessage } from '@repo/utils/errors/get-error-message.util';
import { type ActionFunctionArgs, redirect } from 'react-router';

import { requireUser } from '@/auth/requireUser.util';

import { newRoleSchema } from './newRole.schema';
import { readNewRoleFormValues } from './readNewRoleFormValues.util';
import { toNewRoleFieldErrors } from './toNewRoleFieldErrors.util';

export const action = async ({ request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders — every cqms action authenticates itself
  // (ADR-017); fn_create_role asserts 'create' on 'role' in Postgres.
  const user = await requireUser({ request });

  const formData = await request.formData();
  const parsed = newRoleSchema.safeParse(readNewRoleFormValues({ formData }));

  if (!parsed.success) {
    return { errors: toNewRoleFieldErrors({ error: parsed.error }) };
  }

  try {
    const { roleId } = await createRole({
      description: parsed.data.description || undefined,
      roleName: parsed.data.roleName,
      userId: user.id,
    });
    await replaceRolePermissions({
      permissionIds: parsed.data.permissionIds,
      roleId,
      userId: user.id,
    });

    return redirect(`/cqms/admin/roles/view/${parsed.data.roleName}`);
  } catch (error) {
    return {
      errors: {
        roleName: getErrorMessage({
          error,
          fallback: 'Failed to create role.',
        }),
      },
    };
  }
};
