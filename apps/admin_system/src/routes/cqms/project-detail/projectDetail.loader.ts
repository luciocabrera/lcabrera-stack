import { getProjectById } from '@repo/scan-ingestion/queries/getProjectById.util';
import { getProjectRuns } from '@repo/scan-ingestion/queries/getProjectRuns.util';
import { getProjectScannerTrend } from '@repo/scan-ingestion/queries/getProjectScannerTrend.util';
import { data, type LoaderFunctionArgs } from 'react-router';
import { z } from 'zod';

const paramsSchema = z.object({ projectId: z.string().uuid() });

/**
 * `project` is awaited directly — the page can't render (or 404) without
 * it. `runs`/`trend` are returned as unawaited promises for Suspense
 * streaming, same convention as `enterprise-orders.loader.ts`.
 */
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    throw data('Invalid project id.', { status: 400 });
  }

  const { projectId } = parsedParams.data;

  const project = await getProjectById({ projectId });
  if (!project) {
    throw data('Project not found.', { status: 404 });
  }

  const runsPromise = getProjectRuns({ limit: 50, projectId, skip: 0 });
  const trendPromise = getProjectScannerTrend({ projectId });

  return { project, runsPromise, trendPromise };
};
