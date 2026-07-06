import { existsSync } from 'node:fs';

import { getPool } from '@repo/data-access/db/getPool.util';

import { resolveLocalPath } from '../ingestion/resolveLocalPath.util.ts';

type RegisterProjectArgs = {
  readonly localPath: string;
  readonly name: string;
};

export type RegisterProjectResult = {
  readonly projectId: string;
};

/**
 * Backs the `new-project` action (TECH_SPEC §2.4/§2.8). Canonicalizes via
 * `resolveLocalPath` (realpath only) — deliberately **not**
 * `resolveProjectPath`'s git-root walking, which is reserved for the ad
 * hoc interactive-session auto-matching path. A UI-registered project
 * points at exactly the folder the user picked, even if that folder is a
 * subdirectory of another registered (or unregistered) git repo. The
 * filesystem-existence check is exactly the kind of thing Zod cannot do
 * on its own (TECH_SPEC §2.4's "why Zod stays at the boundary" note) —
 * it's a Node-only check, done here rather than duplicated by the caller.
 */
export const registerProject = async ({
  localPath,
  name,
}: RegisterProjectArgs): Promise<RegisterProjectResult> => {
  if (!existsSync(localPath)) {
    throw new Error(`Path does not exist: ${localPath}`);
  }

  const canonicalPath = resolveLocalPath({ localPath });

  const pool = getPool();
  const result = await pool.query<{ fn_upsert_project: string }>(
    'SELECT cqms.fn_upsert_project($1, $2) AS fn_upsert_project',
    [name, canonicalPath],
  );

  const projectId = result.rows[0]?.fn_upsert_project;
  if (!projectId) {
    throw new Error('Failed to register project.');
  }

  return { projectId };
};
