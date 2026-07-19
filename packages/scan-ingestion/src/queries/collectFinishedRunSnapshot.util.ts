import { getPool } from '@repo/data-access/db/getPool.util';

type CollectFinishedRunSnapshotArgs = {
  readonly runId: string;
};

/**
 * ADR-034 collection step. Once a run has finished, ask the DB for the storage
 * path of the snapshot it pinned — but only when that snapshot is now
 * collectable (no longer the project's latest, and no other queued/running run
 * pins it). `fn_collect_finished_run_snapshot` deletes the pointer row and
 * returns the path in one call; a `null` means nothing to collect (the run is
 * still running, its snapshot is still latest, or another run pins it), so this
 * is safe to call after every scan. The caller performs the filesystem rmSync —
 * the DB owns the pointer, the app owns the files (ADR-028 split).
 */
export const collectFinishedRunSnapshot = async ({
  runId,
}: CollectFinishedRunSnapshotArgs) => {
  const result = await getPool().query<{ storage_path: null | string }>(
    'SELECT cqms.fn_collect_finished_run_snapshot($1) AS storage_path',
    [runId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('fn_collect_finished_run_snapshot returned no row.');
  }
  // `null` (nothing collectable) or the reclaimed path — a pg value, never a
  // `null` literal (unicorn/no-null); the caller rmSyncs only a truthy path.
  return row.storage_path;
};
