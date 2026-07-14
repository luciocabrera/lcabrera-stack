import { getUserWithRoles } from '@repo/scan-ingestion/queries/getUserWithRoles.util';
import { replaceUserRoles } from '@repo/scan-ingestion/queries/replaceUserRoles.util';
import { setUserPassword } from '@repo/scan-ingestion/queries/setUserPassword.util';
import { updateUser } from '@repo/scan-ingestion/queries/updateUser.util';
import { type ActionFunctionArgs, data, redirect } from 'react-router';
import { z } from 'zod';

import { requireUser } from '@/auth/requireUser.util';

import { isCheckboxChecked } from '../utils/isCheckboxChecked.util';
import { parseRouteParams } from '../utils/parseRouteParams.util';
import { editUserSchema } from './editUser.schema';

const paramsSchema = z.object({
  username: z.string().regex(/^[a-z0-9][a-z0-9._-]{1,63}$/),
});

export const action = async ({ params, request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders — every cqms action authenticates itself
  // (ADR-017); the management functions assert 'update' on 'user' and
  // carry the lockout guards (own account, system account, own admin
  // role) in Postgres.
  const user = await requireUser({ request });

  const { username } = parseRouteParams({
    invalidMessage: 'Invalid username.',
    params,
    schema: paramsSchema,
  });
  const target = await getUserWithRoles({ username });
  if (!target) {
    throw data('User not found.', { status: 404 });
  }

  const formData = await request.formData();
  const parsed = editUserSchema.safeParse({
    displayName: formData.get('displayName') ?? '',
    isEnabled: isCheckboxChecked({ formData, name: 'isEnabled' }),
    newPassword: formData.get('newPassword') ?? '',
    roleIds: formData.getAll('roleIds'),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        displayName: fieldErrors.displayName?.[0],
        newPassword: fieldErrors.newPassword?.[0],
        roleIds: fieldErrors.roleIds?.[0],
      },
    };
  }

  try {
    await updateUser({
      displayName: parsed.data.displayName,
      isEnabled: parsed.data.isEnabled,
      targetUserId: target.id,
      userId: user.id,
    });
    await replaceUserRoles({
      roleIds: parsed.data.roleIds,
      targetUserId: target.id,
      userId: user.id,
    });
    if (parsed.data.newPassword !== '') {
      await setUserPassword({
        password: parsed.data.newPassword,
        targetUserId: target.id,
        userId: user.id,
      });
    }

    return redirect(`/cqms/admin/users/view/${target.username}`);
  } catch (error) {
    return {
      errors: {
        displayName:
          error instanceof Error ? error.message : 'Failed to update user.',
      },
    };
  }
};
