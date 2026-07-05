import { existsSync } from 'node:fs';

import { getPool } from '@repo/data-access/db/getPool.util';

import { resolveProjectPath } from '../ingestion/matchProject.util.ts';

type UpdateProjectArgs = {
  readonly localPath: string;
  readonly name: string;
  readonly projectId: string;
};

/**
 * Backs the `edit-project` action. Unlike `registerProject` (which
 * upserts by the `local_path` unique constraint — the ad hoc ingestion
 * matching key), this updates a specific, already-known project row by
 * id, so changing `localPath` here is a real rename of that row's key,
 * not a match-or-create.
 */
export const updateProject = async ({
  localPath,
  name,
  projectId,
}: UpdateProjectArgs): Promise<void> => {
  if (!existsSync(localPath)) {
    throw new Error(`Path does not exist: ${localPath}`);
  }

  const { canonicalPath } = resolveProjectPath({ localPath });

  const pool = getPool();
  const result = await pool.query(
    'UPDATE cqms.projects SET name = $1, local_path = $2 WHERE id = $3',
    [name, canonicalPath, projectId],
  );

  if (result.rowCount === 0) {
    throw new Error('Project not found.');
  }
};
