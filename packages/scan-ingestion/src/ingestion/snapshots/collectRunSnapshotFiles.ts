import { rmSync } from 'node:fs';

import { collectFinishedRunSnapshot } from '../../queries/collectFinishedRunSnapshot.util.ts';
import { getSnapshotsRoot } from './getSnapshotsRoot.util.ts';
import { isPathWithinSnapshotsRoot } from './isPathWithinSnapshotsRoot.util.ts';

type CollectRunSnapshotFilesArgs = {
  readonly runId: string;
};

/**
 * ADR-034 collection — the filesystem half, counterpart to saveProjectSnapshot's
 * replaced-directory delete. After a run finishes, the DB
 * (`fn_collect_finished_run_snapshot`, via `collectFinishedRunSnapshot`) deletes
 * the pointer of any now-collectable pinned snapshot and returns its
 * `storage_path`; this rmSyncs that tree — guarded to the snapshots root so a
 * corrupt or foreign DB path can never delete anything else (ADR-028: the DB
 * owns the pointer, the app owns the files). Returns the collected path, or null
 * when nothing was collectable, so callers and tests can observe the outcome.
 */
export const collectRunSnapshotFiles = async ({
  runId,
}: CollectRunSnapshotFilesArgs) => {
  const storagePath = await collectFinishedRunSnapshot({ runId });
  if (
    storagePath &&
    isPathWithinSnapshotsRoot({
      candidatePath: storagePath,
      snapshotsRoot: getSnapshotsRoot(),
    })
  ) {
    rmSync(storagePath, { force: true, recursive: true });
  }
  return storagePath;
};
