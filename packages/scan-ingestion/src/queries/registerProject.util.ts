import { getPool } from '@lcabrera/server/db/get-pool.util';

export type RegisterProjectResult = {
  readonly projectId: string;
};

type RegisterProjectArgs = {
  readonly name: string;
  readonly userId: string;
};

/**
 * Backs the `new-project` action. Since ADR-028 registration carries no
 * path — a project is just an identity row; its code arrives afterwards
 * as a synced snapshot (see saveProjectSnapshot). With the old
 * `local_path` unique key gone there is nothing to upsert against, so
 * fn_register_project is a plain permission-asserted INSERT.
 */
export const registerProject = async ({
  name,
  userId,
}: RegisterProjectArgs): Promise<RegisterProjectResult> => {
  const pool = getPool();
  const result = await pool.query<{ fn_register_project: string }>(
    'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
    [userId, name],
  );

  const projectId = result.rows[0]?.fn_register_project;
  if (!projectId) {
    throw new Error('Failed to register project.');
  }

  return { projectId };
};
