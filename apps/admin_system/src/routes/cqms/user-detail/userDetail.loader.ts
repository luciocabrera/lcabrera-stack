import { getUserWithRoles } from '@repo/scan-ingestion/queries/getUserWithRoles.util';
import { data, type LoaderFunctionArgs } from 'react-router';
import { z } from 'zod';

import { requirePermission } from '@/auth/requirePermission.util';

const paramsSchema = z.object({
  username: z.string().regex(/^[a-z0-9][a-z0-9._-]{1,63}$/),
});

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requirePermission({ action: 'read', request, resourceType: 'user' });

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    throw data('Invalid username.', { status: 400 });
  }

  const user = await getUserWithRoles({
    username: parsedParams.data.username,
  });
  if (!user) {
    throw data('User not found.', { status: 404 });
  }

  return { user };
};
