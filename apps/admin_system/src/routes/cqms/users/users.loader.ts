import type { LoaderFunctionArgs } from 'react-router';

import { getUserListView } from '@repo/scan-ingestion/queries/getUserListView.util';

import { requirePermission } from '@/auth/requirePermission.util';

/**
 * Permission-gated (ADR-024: managing users needs the user resource
 * permissions — admin-only per the 0008 seeds); the list itself streams
 * like every other table promise.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requirePermission({ action: 'read', request, resourceType: 'user' });

  const usersPromise = getUserListView();
  return { usersPromise };
};
