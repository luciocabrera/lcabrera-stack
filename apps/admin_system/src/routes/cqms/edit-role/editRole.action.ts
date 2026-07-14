import { getRoleWithPermissions } from '@repo/scan-ingestion/queries/getRoleWithPermissions.util';
import { replaceRolePermissions } from '@repo/scan-ingestion/queries/replaceRolePermissions.util';
import { updateRole } from '@repo/scan-ingestion/queries/updateRole.util';
import { type ActionFunctionArgs, data, redirect } from 'react-router';
import { z } from 'zod';

import { requireUser } from '@/auth/requireUser.util';

import { isCheckboxChecked } from '../utils/isCheckboxChecked.util';
import { parseRouteParams } from '../utils/parseRouteParams.util';
import { editRoleSchema } from './editRole.schema';

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
  const parsed = editRoleSchema.safeParse({
    description: formData.get('description') ?? '',
    isEnabled: isCheckboxChecked({ formData, name: 'isEnabled' }),
    permissionIds: formData.getAll('permissionIds'),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        description: fieldErrors.description?.[0],
        permissionIds: fieldErrors.permissionIds?.[0],
      },
    };
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
        description:
          error instanceof Error ? error.message : 'Failed to update role.',
      },
    };
  }
};
