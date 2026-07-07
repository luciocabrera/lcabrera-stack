import { getPool } from '@repo/data-access/db/getPool.util';

export type RoleListViewRow = {
  readonly description: null | string;
  readonly enabled: boolean;
  readonly id: string;
  readonly permission_count: number;
  readonly role_name: string;
  readonly user_count: number;
};

/** Backs the `/cqms/admin/roles` list (ADR-024). */
export const getRoleListView = async (): Promise<
  readonly RoleListViewRow[]
> => {
  const pool = getPool();
  const result = await pool.query<RoleListViewRow>(
    `SELECT r.id, r.role_name, r.description, r.enabled,
            (SELECT count(*)::int FROM cqms.v_role_permissions rp
              WHERE rp.role_id = r.id) AS permission_count,
            (SELECT count(*)::int FROM cqms.v_user_roles ur
              WHERE ur.role_id = r.id) AS user_count
     FROM cqms.v_roles r
     ORDER BY r.role_name`,
  );
  return result.rows;
};
