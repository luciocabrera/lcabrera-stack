import type { LoaderFunctionArgs } from 'react-router';

import { discoverProjectWorkspaces } from '@repo/scan-ingestion/ingestion/workspaces/discoverProjectWorkspaces.util';
import { getActiveScanners } from '@repo/scan-ingestion/queries/getActiveScanners.util';
import { getProjectActiveRun } from '@repo/scan-ingestion/queries/getProjectActiveRun.util';
import { getProjectById } from '@repo/scan-ingestion/queries/getProjectById.util';
import { data } from 'react-router';
import { z } from 'zod';

import { formatRunElapsed } from './formatRunElapsed.util';

const paramsSchema = z.object({ projectId: z.uuid() });

const loadWorkspaces = async (projectId: string) => {
  const project = await getProjectById({ projectId });
  return project?.snapshot_path
    ? discoverProjectWorkspaces({ rootPath: project.snapshot_path })
    : [];
};

/**
 * `scanners` and `workspaces` stream via unawaited promises — small
 * lookups, but nothing here needs them synchronously (no 404 check
 * depends on them), so they follow the same list-streaming convention as
 * everything else in this route tree rather than blocking the page.
 *
 * Workspaces come from a FRESH filesystem discovery (ADR-021) against the
 * project's latest snapshot directory (ADR-028) — a GET must not write,
 * and the form should offer what the synced code actually contains. The
 * action re-discovers for validation. No snapshot ⇒ no workspaces (and
 * `hasSnapshot` blocks the form entirely).
 */
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    throw data('Invalid project id.', { status: 400 });
  }

  const { projectId } = parsedParams.data;

  // Defense in depth (direct URL nav, stale tab, back-button) — the
  // project page already hides the link into this route when a run is
  // active or no snapshot is synced, and the server-side functions assert
  // both too (migrations 0021/0027), but this stops the form from even
  // rendering as the third layer.
  const activeRunRow = await getProjectActiveRun({ projectId });
  const activeRun = activeRunRow
    ? {
        elapsed: formatRunElapsed({
          nowMs: Date.now(),
          startedAtMs: Date.parse(activeRunRow.startedAt),
        }),
        runId: activeRunRow.runId,
      }
    : undefined;
  const project = await getProjectById({ projectId });
  const hasSnapshot = Boolean(project?.latest_snapshot_id);

  const scannersPromise = getActiveScanners();
  const workspacesPromise = loadWorkspaces(projectId);

  return {
    activeRun,
    hasSnapshot,
    projectId,
    scannersPromise,
    workspacesPromise,
  };
};
