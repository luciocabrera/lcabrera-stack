import type { LoaderFunctionArgs } from 'react-router';

import { getAllPermissions } from '@repo/scan-ingestion/queries/getAllPermissions.util';
import { getRoleWithPermissions } from '@repo/scan-ingestion/queries/getRoleWithPermissions.util';
import { data } from 'react-router';
import { z } from 'zod';

import { requirePermission } from '@/auth/requirePermission.util';

import { parseRouteParams } from '../utils/parseRouteParams.util';

const paramsSchema = z.object({
  roleName: z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/),
});

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requirePermission({ action: 'read', request, resourceType: 'role' });

  const { roleName } = parseRouteParams({
    invalidMessage: 'Invalid role name.',
    params,
    schema: paramsSchema,
  });

  const role = await getRoleWithPermissions({ roleName });
  if (!role) {
    throw data('Role not found.', { status: 404 });
  }

  // Awaited alongside the role: the page maps permission ids to labels.
  const permissions = await getAllPermissions();
  return { permissions, role };
};
