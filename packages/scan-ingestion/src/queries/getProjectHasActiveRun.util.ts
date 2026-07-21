import { getPool } from '@lcabrera/server/db/get-pool.util';

type GetProjectHasActiveRunArgs = {
  readonly projectId: string;
};

/**
 * Cheap existence check backing the concurrency guardrail's UI side —
 * cqms.fn_create_run enforces the same rule server-side (migration 0021),
 * this just lets the UI disable "Trigger Scan" before the user ever
 * submits and hits that rejection. Backed by the existing
 * runs_project_created_idx (project_id, created_at DESC) index.
 */
export const getProjectHasActiveRun = async ({
  projectId,
}: GetProjectHasActiveRunArgs): Promise<boolean> => {
  const pool = getPool();
  const result = await pool.query<{ has_active_run: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM cqms.v_runs WHERE project_id = $1 AND status IN ('queued', 'running')
     ) AS has_active_run`,
    [projectId],
  );
  return result.rows[0]?.has_active_run ?? false;
};
