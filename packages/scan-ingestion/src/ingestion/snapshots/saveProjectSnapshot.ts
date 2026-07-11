import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import path from 'node:path';

import { setProjectSnapshot } from '../../queries/setProjectSnapshot.util.ts';
import { extractZipArchive } from './extractZipArchive.util.ts';
import { getSnapshotsRoot } from './getSnapshotsRoot.util.ts';

type SaveProjectSnapshotArgs = {
  readonly archiveBytes: Uint8Array;
  readonly archiveName: string;
  readonly projectId: string;
  readonly sourceLabel: string;
  readonly userId: string;
};

export type SaveProjectSnapshotResult = {
  readonly fileCount: number;
  readonly sizeBytes: number;
  readonly snapshotId: string;
  readonly storagePath: string;
};

/**
 * The sync-then-scan write path (ADR-028): unpack the uploaded archive
 * into a fresh `<root>/<projectId>/<random>/` directory, record it via
 * fn_set_project_snapshot (which swaps `latest_snapshot_id`), then delete
 * the REPLACED snapshot's directory — latest wins, metadata rows survive.
 * The directory name is app-generated (not the DB snapshot id) so the
 * files can be fully extracted before any DB write; a failed extraction
 * or rejected permission cleans up its own directory and leaves the
 * previous snapshot untouched. Replaced-directory deletion is guarded to
 * paths under the snapshots root — a corrupt/foreign storage_path value
 * in the DB must never delete anything else on the host.
 */
export const saveProjectSnapshot = async ({
  archiveBytes,
  archiveName,
  projectId,
  sourceLabel,
  userId,
}: SaveProjectSnapshotArgs): Promise<SaveProjectSnapshotResult> => {
  const snapshotsRoot = path.resolve(getSnapshotsRoot());
  const storagePath = path.join(snapshotsRoot, projectId, randomUUID());

  try {
    const { fileCount, totalBytes } = extractZipArchive({
      archiveBytes,
      targetDirectory: storagePath,
    });

    const { replacedStoragePath, snapshotId } = await setProjectSnapshot({
      archiveName,
      fileCount,
      projectId,
      sizeBytes: totalBytes,
      sourceLabel,
      storagePath,
      userId,
    });

    if (
      replacedStoragePath &&
      path
        .resolve(replacedStoragePath)
        .startsWith(`${snapshotsRoot}${path.sep}`)
    ) {
      rmSync(replacedStoragePath, { force: true, recursive: true });
    }

    return { fileCount, sizeBytes: totalBytes, snapshotId, storagePath };
  } catch (error) {
    rmSync(storagePath, { force: true, recursive: true });
    throw error;
  }
};
