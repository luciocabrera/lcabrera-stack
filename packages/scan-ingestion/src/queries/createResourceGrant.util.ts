import { getPool } from '@repo/data-access/db/getPool.util';

export type CreateResourceGrantResult = {
  readonly grantId: string;
};

type CreateResourceGrantArgs = {
  readonly action: string;
  readonly granteeUserId: string;
  readonly resourceId: string;
  readonly resourceType: string;
  readonly userId: string;
};

/**
 * Creates a per-instance grant through cqms.fn_create_resource_grant
 * (ADR-024): a narrow allow on ONE resource row, e.g. execute/scan on a
 * project uuid = "may trigger scans on project Y" (the tuple fn_create_run
 * asserts). Managing a grant requires 'update' on its resource type.
 */
export const createResourceGrant = async ({
  action,
  granteeUserId,
  resourceId,
  resourceType,
  userId,
}: CreateResourceGrantArgs): Promise<CreateResourceGrantResult> => {
  const pool = getPool();
  const result = await pool.query<{ fn_create_resource_grant: string }>(
    'SELECT cqms.fn_create_resource_grant($1, $2, $3, $4, $5) AS fn_create_resource_grant',
    [userId, granteeUserId, action, resourceType, resourceId],
  );

  const grantId = result.rows[0]?.fn_create_resource_grant;
  if (!grantId) {
    throw new Error('Failed to create the grant.');
  }
  return { grantId };
};
