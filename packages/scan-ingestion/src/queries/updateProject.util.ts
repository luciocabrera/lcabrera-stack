import { getPool } from '@repo/data-access/db/getPool.util';

type UpdateProjectArgs = {
  readonly name: string;
  readonly projectId: string;
  readonly userId: string;
};

/**
 * Backs the `edit-project` action. Since ADR-028 a project's code
 * location is not editable metadata — it is whatever the latest synced
 * snapshot is (fn_set_project_snapshot owns that pointer) — so editing a
 * project means editing its display fields only.
 */
export const updateProject = async ({
  name,
  projectId,
  userId,
}: UpdateProjectArgs): Promise<void> => {
  const pool = getPool();
  // fn_update_project asserts the 'update project' permission first and
  // raises 'Project not found.' for a missing/soft-deleted row (ADR-018).
  await pool.query('SELECT cqms.fn_update_project($1, $2, $3)', [
    userId,
    projectId,
    name,
  ]);
};
