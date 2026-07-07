import type { LoaderFunctionArgs } from 'react-router';

import { getAllPermissions } from '@repo/scan-ingestion/queries/getAllPermissions.util';

import { requirePermission } from '@/auth/requirePermission.util';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requirePermission({ action: 'create', request, resourceType: 'role' });

  const permissionsPromise = getAllPermissions();
  return { permissionsPromise };
};
