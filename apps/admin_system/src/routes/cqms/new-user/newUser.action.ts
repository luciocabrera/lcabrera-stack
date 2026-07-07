import { createUser } from '@repo/scan-ingestion/queries/createUser.util';
import { replaceUserRoles } from '@repo/scan-ingestion/queries/replaceUserRoles.util';
import { type ActionFunctionArgs, redirect } from 'react-router';

import { requireUser } from '@/auth/requireUser.util';

import { newUserSchema } from './newUser.schema';

export const action = async ({ request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders — every cqms action authenticates itself
  // (ADR-017); fn_create_user asserts 'create' on 'user' in Postgres.
  const user = await requireUser({ request });

  const formData = await request.formData();
  const parsed = newUserSchema.safeParse({
    displayName: formData.get('displayName') ?? '',
    password: formData.get('password') ?? '',
    roleIds: formData.getAll('roleIds'),
    username: formData.get('username') ?? '',
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        displayName: fieldErrors.displayName?.[0],
        password: fieldErrors.password?.[0],
        roleIds: fieldErrors.roleIds?.[0],
        username: fieldErrors.username?.[0],
      },
    };
  }

  try {
    const { createdUserId } = await createUser({
      displayName: parsed.data.displayName,
      password: parsed.data.password,
      userId: user.id,
      username: parsed.data.username,
    });
    await replaceUserRoles({
      roleIds: parsed.data.roleIds,
      targetUserId: createdUserId,
      userId: user.id,
    });

    return redirect(`/cqms/admin/users/view/${parsed.data.username}`);
  } catch (error) {
    return {
      errors: {
        username:
          error instanceof Error ? error.message : 'Failed to create user.',
      },
    };
  }
};
