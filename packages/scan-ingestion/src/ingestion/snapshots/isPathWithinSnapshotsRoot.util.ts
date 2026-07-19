import path from 'node:path';

type IsPathWithinSnapshotsRootArgs = {
  readonly candidatePath: string;
  readonly snapshotsRoot: string;
};

/**
 * True when `candidatePath` resolves to a location strictly inside
 * `snapshotsRoot`. The guard on every snapshot-directory deletion (ADR-028): a
 * corrupt or foreign `storage_path` value in the DB must never let an rmSync
 * escape the snapshot store. Pure path math — no filesystem access — so both the
 * sync write path (saveProjectSnapshot) and the run-finish collection path
 * (orchestrator) share one testable check. The trailing separator makes it a
 * strict-descendant test: the root itself, and a sibling like `<root>-evil`, are
 * both rejected.
 */
export const isPathWithinSnapshotsRoot = ({
  candidatePath,
  snapshotsRoot,
}: IsPathWithinSnapshotsRootArgs) =>
  path
    .resolve(candidatePath)
    .startsWith(`${path.resolve(snapshotsRoot)}${path.sep}`);
