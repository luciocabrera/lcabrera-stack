import { getPool } from '@lcabrera/server/db/get-pool.util';

type DeleteResourceGrantArgs = {
  readonly grantId: string;
  readonly userId: string;
};

/**
 * Soft-deletes a grant through cqms.fn_delete_resource_grant (ADR-024) —
 * grants carry the full audit set, so revocation is a dated disable, not a
 * row removal.
 */
export const deleteResourceGrant = async ({
  grantId,
  userId,
}: DeleteResourceGrantArgs): Promise<void> => {
  const pool = getPool();
  await pool.query('SELECT cqms.fn_delete_resource_grant($1, $2)', [
    userId,
    grantId,
  ]);
};
