import { getErrorMessage } from '@lcabrera/utils/errors/get-error-message.util';
import { createUser } from '@repo/scan-ingestion/queries/createUser.util';
import { replaceUserRoles } from '@repo/scan-ingestion/queries/replaceUserRoles.util';
import { type ActionFunctionArgs, redirect } from 'react-router';

import { requireUser } from '@/auth/requireUser.util';

import { newUserSchema } from './newUser.schema';
import { readNewUserFormValues } from './readNewUserFormValues.util';
import { toNewUserFieldErrors } from './toNewUserFieldErrors.util';

export const action = async ({ request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders — every cqms action authenticates itself
  // (ADR-017); fn_create_user asserts 'create' on 'user' in Postgres.
  const user = await requireUser({ request });

  const formData = await request.formData();
  const parsed = newUserSchema.safeParse(readNewUserFormValues({ formData }));

  if (!parsed.success) {
    return { errors: toNewUserFieldErrors({ error: parsed.error }) };
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
        username: getErrorMessage({
          error,
          fallback: 'Failed to create user.',
        }),
      },
    };
  }
};
