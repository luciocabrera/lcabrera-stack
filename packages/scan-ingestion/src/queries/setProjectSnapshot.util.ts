import { getPool } from '@repo/data-access/db/getPool.util';

export type SetProjectSnapshotResult = {
  readonly replacedStoragePath: null | string;
  readonly snapshotId: string;
};

type SetProjectSnapshotArgs = {
  readonly archiveName: string;
  readonly fileCount: number;
  readonly projectId: string;
  readonly sizeBytes: number;
  readonly sourceLabel: string;
  readonly storagePath: string;
  readonly userId: string;
};

/**
 * Records a synced snapshot and repoints the project's
 * `latest_snapshot_id` in one DB call (fn_set_project_snapshot, ADR-028).
 * Returns the REPLACED snapshot's storage path (null on first sync) so the
 * caller can delete that directory — latest-wins keeps metadata rows but
 * only the newest snapshot's files (PRD_V2 §3). The function asserts the
 * instance-level 'update project' permission (ADR-018).
 */
export const setProjectSnapshot = async ({
  archiveName,
  fileCount,
  projectId,
  sizeBytes,
  sourceLabel,
  storagePath,
  userId,
}: SetProjectSnapshotArgs): Promise<SetProjectSnapshotResult> => {
  const pool = getPool();
  const result = await pool.query<{
    replaced_storage_path: null | string;
    snapshot_id: string;
  }>('SELECT * FROM cqms.fn_set_project_snapshot($1, $2, $3, $4, $5, $6, $7)', [
    userId,
    projectId,
    storagePath,
    archiveName,
    sizeBytes,
    fileCount,
    sourceLabel,
  ]);

  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to record the snapshot.');
  }

  return {
    replacedStoragePath: row.replaced_storage_path,
    snapshotId: row.snapshot_id,
  };
};
