import { getPool } from '@repo/server/db/get-pool.util';

import type { DiscoveredWorkspace } from '../ingestion/workspaces/discoverProjectWorkspaces.util.ts';

type ReplaceProjectWorkspacesArgs = {
  readonly projectId: string;
  readonly userId: string;
  readonly workspaces: readonly DiscoveredWorkspace[];
};

/**
 * Persists a discovery snapshot wholesale via
 * fn_replace_project_workspaces (ADR-021, DELETE-then-INSERT — idempotent
 * by construction). Callers treat this as best-effort: a refresh failure
 * must never block registering a project or triggering a scan.
 */
export const replaceProjectWorkspaces = async ({
  projectId,
  userId,
  workspaces,
}: ReplaceProjectWorkspacesArgs): Promise<void> => {
  const pool = getPool();
  await pool.query('SELECT cqms.fn_replace_project_workspaces($1, $2, $3)', [
    userId,
    projectId,
    JSON.stringify(workspaces),
  ]);
};
