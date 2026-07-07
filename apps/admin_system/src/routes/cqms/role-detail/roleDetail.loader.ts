import { getAllPermissions } from '@repo/scan-ingestion/queries/getAllPermissions.util';
import { getRoleWithPermissions } from '@repo/scan-ingestion/queries/getRoleWithPermissions.util';
import { data, type LoaderFunctionArgs } from 'react-router';
import { z } from 'zod';

import { requirePermission } from '@/auth/requirePermission.util';

const paramsSchema = z.object({
  roleName: z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/),
});

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requirePermission({ action: 'read', request, resourceType: 'role' });

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    throw data('Invalid role name.', { status: 400 });
  }

  const role = await getRoleWithPermissions({
    roleName: parsedParams.data.roleName,
  });
  if (!role) {
    throw data('Role not found.', { status: 404 });
  }

  // Awaited alongside the role: the page maps permission ids to labels.
  const permissions = await getAllPermissions();
  return { permissions, role };
};
