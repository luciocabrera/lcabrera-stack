import { discoverProjectWorkspaces } from '@repo/scan-ingestion/ingestion/workspaces/discoverProjectWorkspaces.util';
import { getActiveScanners } from '@repo/scan-ingestion/queries/getActiveScanners.util';
import { getProjectById } from '@repo/scan-ingestion/queries/getProjectById.util';
import { data, type LoaderFunctionArgs } from 'react-router';
import { z } from 'zod';

const paramsSchema = z.object({ projectId: z.string().uuid() });

const loadWorkspaces = async (projectId: string) => {
  const project = await getProjectById({ projectId });
  return project
    ? discoverProjectWorkspaces({ rootPath: project.local_path })
    : [];
};

/**
 * `scanners` and `workspaces` stream via unawaited promises — small
 * lookups, but nothing here needs them synchronously (no 404 check
 * depends on them), so they follow the same list-streaming convention as
 * everything else in this route tree rather than blocking the page.
 *
 * Workspaces come from a FRESH filesystem discovery (ADR-021), not the
 * persisted cqms.project_workspaces snapshot — a GET must not write, and
 * the form should offer what exists on disk right now. The action
 * re-discovers for validation and persists the snapshot then.
 */
export const loader = ({ params }: LoaderFunctionArgs) => {
  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    throw data('Invalid project id.', { status: 400 });
  }

  const scannersPromise = getActiveScanners();
  const workspacesPromise = loadWorkspaces(parsedParams.data.projectId);

  return {
    projectId: parsedParams.data.projectId,
    scannersPromise,
    workspacesPromise,
  };
};
