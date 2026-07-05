import { getPool } from '@repo/data-access/db/getPool.util';

export type ProjectListViewRow = {
  readonly created_at: string;
  readonly default_branch: string;
  readonly id: string;
  readonly last_scanned_at: string | null;
  readonly latest_run_id: string | null;
  readonly latest_run_status: string | null;
  readonly local_path: string;
  readonly name: string;
  readonly total_high: number | null;
  readonly total_medium: number | null;
};

/**
 * Backs `cqms/root.ts` — every project joined to its latest run's rolled-up
 * severity counts, via `cqms.project_run_summary` (TECH_SPEC §2.3a's
 * LATERAL-join view, not a loader-side N+1).
 */
export const getProjectListView = async (): Promise<
  readonly ProjectListViewRow[]
> => {
  const pool = getPool();
  const result = await pool.query<ProjectListViewRow>(
    'SELECT * FROM cqms.project_run_summary ORDER BY created_at DESC',
  );
  return result.rows;
};
