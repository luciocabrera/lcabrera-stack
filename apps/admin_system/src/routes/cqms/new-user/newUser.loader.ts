import type { LoaderFunctionArgs } from 'react-router';

import { getRoleListView } from '@repo/scan-ingestion/queries/getRoleListView.util';

import { requirePermission } from '@/auth/requirePermission.util';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requirePermission({ action: 'create', request, resourceType: 'user' });

  const rolesPromise = getRoleListView();
  return { rolesPromise };
};
