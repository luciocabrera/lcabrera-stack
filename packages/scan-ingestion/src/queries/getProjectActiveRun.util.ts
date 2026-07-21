import { getPool } from '@repo/server/db/get-pool.util';

export type ProjectActiveRun = {
  readonly runId: string;
  readonly startedAt: string;
};

type GetProjectActiveRunArgs = {
  readonly projectId: string;
};

/**
 * The active (queued/running) run for a project, if any — the detail-returning
 * companion to `getProjectHasActiveRun`. Backs the 409-conflict surface
 * (PRD_V2 §8): the trigger action and loader need the run's id + start time to
 * link to it and report how long it has been running. `started_at` falls back to
 * `created_at` for a run queued but not yet started. Ordered newest-first with
 * `LIMIT 1` — migration 0021's per-project lock caps a project at one active run,
 * so there is at most one anyway. `undefined` when nothing is active.
 */
export const getProjectActiveRun = async ({
  projectId,
}: GetProjectActiveRunArgs): Promise<ProjectActiveRun | undefined> => {
  const pool = getPool();
  const result = await pool.query<{ run_id: string; started_at: Date }>(
    `SELECT id AS run_id, COALESCE(started_at, created_at) AS started_at
       FROM cqms.v_runs
      WHERE project_id = $1 AND status IN ('queued', 'running')
      ORDER BY created_at DESC
      LIMIT 1`,
    [projectId],
  );
  const row = result.rows[0];
  if (!row) {
    return;
  }
  return { runId: row.run_id, startedAt: row.started_at.toISOString() };
};
