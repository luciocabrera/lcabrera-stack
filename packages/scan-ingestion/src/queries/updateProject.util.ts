import { getPool } from '@repo/data-access/db/getPool.util';

import { resolveLocalPath } from '../ingestion/resolveLocalPath.util.ts';

type UpdateProjectArgs = {
  readonly localPath: string;
  readonly name: string;
  readonly projectId: string;
  readonly userId: string;
};

/**
 * Backs the `edit-project` action. Unlike `registerProject` (which
 * upserts by the `local_path` unique constraint — the ad hoc ingestion
 * matching key), this updates a specific, already-known project row by
 * id, so changing `localPath` here is a real rename of that row's key,
 * not a match-or-create. Canonicalizes via `resolveLocalPath` (realpath
 * only, no git-root walking) — using the git-walking resolver here was a
 * real bug: re-pathing a project to a subfolder of the same git repo
 * (e.g. `packages/ui` inside a monorepo already registered at its root)
 * silently canonicalized back to the unchanged root path, making the
 * edit appear to do nothing. The path-existence check lives inside
 * `resolveLocalPath` (realpath throws "Path does not exist" for a missing
 * path).
 */
export const updateProject = async ({
  localPath,
  name,
  projectId,
  userId,
}: UpdateProjectArgs): Promise<void> => {
  const canonicalPath = resolveLocalPath({ localPath });

  const pool = getPool();
  // fn_update_project asserts the 'update project' permission first and
  // raises 'Project not found.' for a missing/soft-deleted row (ADR-018).
  await pool.query('SELECT cqms.fn_update_project($1, $2, $3, $4)', [
    userId,
    projectId,
    name,
    canonicalPath,
  ]);
};
