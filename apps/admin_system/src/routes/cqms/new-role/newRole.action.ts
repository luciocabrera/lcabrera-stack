import { createRole } from '@repo/scan-ingestion/queries/createRole.util';
import { replaceRolePermissions } from '@repo/scan-ingestion/queries/replaceRolePermissions.util';
import { type ActionFunctionArgs, redirect } from 'react-router';

import { requireUser } from '@/auth/requireUser.util';

import { newRoleSchema } from './newRole.schema';

export const action = async ({ request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders — every cqms action authenticates itself
  // (ADR-017); fn_create_role asserts 'create' on 'role' in Postgres.
  const user = await requireUser({ request });

  const formData = await request.formData();
  const parsed = newRoleSchema.safeParse({
    description: formData.get('description') ?? '',
    permissionIds: formData.getAll('permissionIds'),
    roleName: formData.get('roleName') ?? '',
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        permissionIds: fieldErrors.permissionIds?.[0],
        roleName: fieldErrors.roleName?.[0],
      },
    };
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
        roleName:
          error instanceof Error ? error.message : 'Failed to create role.',
      },
    };
  }
};
