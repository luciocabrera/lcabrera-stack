import type { LoaderFunctionArgs } from 'react-router';

import { checkUserPermission } from '@repo/scan-ingestion/queries/checkUserPermission.util';
import { getProjectById } from '@repo/scan-ingestion/queries/getProjectById.util';
import { getProjectGrants } from '@repo/scan-ingestion/queries/getProjectGrants.util';
import { getProjectHasActiveRun } from '@repo/scan-ingestion/queries/getProjectHasActiveRun.util';
import { getProjectRuns } from '@repo/scan-ingestion/queries/getProjectRuns.util';
import { getProjectScannerTrend } from '@repo/scan-ingestion/queries/getProjectScannerTrend.util';
import { getUserListView } from '@repo/scan-ingestion/queries/getUserListView.util';
import { data } from 'react-router';
import { z } from 'zod';

import { requireUser } from '@/auth/requireUser.util';

import { parseRouteParams } from '../utils/parseRouteParams.util';

const paramsSchema = z.object({ projectId: z.uuid() });

/**
 * `project` is awaited directly — the page can't render (or 404) without
 * it. `runs`/`trend` are returned as unawaited promises for Suspense
 * streaming, same convention as `enterprise-orders.loader.ts`. The grants
 * editor (ADR-024) only loads for users who could actually manage grants
 * (`update` on `project`, the same check fn_create_resource_grant makes)
 * — everyone else gets the flag and no user/grant data at all.
 */
export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const user = await requireUser({ request });

  const { projectId } = parseRouteParams({
    invalidMessage: 'Invalid project id.',
    params,
    schema: paramsSchema,
  });

  const project = await getProjectById({ projectId });
  if (!project) {
    throw data('Project not found.', { status: 404 });
  }

  // Both are awaited rather than deferred — the "Trigger Scan" link needs
  // `hasActiveRun` to decide whether to render at all, and `canManageGrants`
  // gates the two queries below. They read different tables and neither uses
  // the other's result, so they race instead of waterfalling.
  const [hasActiveRun, grantPermission] = await Promise.all([
    getProjectHasActiveRun({ projectId }),
    checkUserPermission({
      action: 'update',
      resourceId: projectId,
      resourceType: 'project',
      userId: user.id,
    }),
  ]);
  const canManageGrants = grantPermission.allowed;

  const runsPromise = getProjectRuns({ limit: 50, projectId, skip: 0 });
  const trendPromise = getProjectScannerTrend({ projectId });
  const grantsPromise = canManageGrants
    ? getProjectGrants({ projectId })
    : Promise.resolve([]);
  const usersPromise = canManageGrants
    ? getUserListView()
    : Promise.resolve([]);

  return {
    canManageGrants,
    grantsPromise,
    hasActiveRun,
    project,
    runsPromise,
    trendPromise,
    usersPromise,
  };
};
