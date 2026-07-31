import type { ActionFunctionArgs } from 'react-router';

import { getErrorMessage } from '@lcabrera/utils/errors/get-error-message.util';
import { getRoleWithPermissions } from '@repo/scan-ingestion/queries/getRoleWithPermissions.util';
import { replaceRolePermissions } from '@repo/scan-ingestion/queries/replaceRolePermissions.util';
import { updateRole } from '@repo/scan-ingestion/queries/updateRole.util';
import { data, redirect } from 'react-router';
import { z } from 'zod';

import { requireUser } from '@/auth/requireUser.util';

import { parseRouteParams } from '../utils/parseRouteParams.util';
import { editRoleSchema } from './editRole.schema';
import { readEditRoleFormValues } from './readEditRoleFormValues.util';
import { toEditRoleFieldErrors } from './toEditRoleFieldErrors.util';

const paramsSchema = z.object({
  roleName: z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/),
});

export const action = async ({ params, request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders — every cqms action authenticates itself
  // (ADR-017); the management functions assert 'update' on 'role' and the
  // seeded admin role stays immutable in Postgres.
  const user = await requireUser({ request });

  const { roleName } = parseRouteParams({
    invalidMessage: 'Invalid role name.',
    params,
    schema: paramsSchema,
  });
  const role = await getRoleWithPermissions({ roleName });
  if (!role) {
    throw data('Role not found.', { status: 404 });
  }

  const formData = await request.formData();
  const parsed = editRoleSchema.safeParse(readEditRoleFormValues({ formData }));

  if (!parsed.success) {
    return { errors: toEditRoleFieldErrors({ error: parsed.error }) };
  }

  try {
    await updateRole({
      description: parsed.data.description || undefined,
      isEnabled: parsed.data.isEnabled,
      roleId: role.id,
      userId: user.id,
    });
    await replaceRolePermissions({
      permissionIds: parsed.data.permissionIds,
      roleId: role.id,
      userId: user.id,
    });

    return redirect(`/cqms/admin/roles/view/${role.role_name}`);
  } catch (error) {
    return {
      errors: {
        description: getErrorMessage({
          error,
          fallback: 'Failed to update role.',
        }),
      },
    };
  }
};
