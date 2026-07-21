import { getPool } from '@lcabrera/server/db/get-pool.util';

export type ProjectListViewRow = {
  readonly created_at: string;
  readonly default_branch: string;
  readonly id: string;
  readonly last_scanned_at: null | string;
  readonly latest_run_id: null | string;
  readonly latest_run_status: null | string;
  readonly name: string;
  readonly synced_at: null | string;
  readonly total_high: null | number;
  readonly total_medium: null | number;
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
