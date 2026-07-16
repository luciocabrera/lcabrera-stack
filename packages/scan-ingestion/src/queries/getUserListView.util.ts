import { getPool } from '@repo/data-access/db/getPool.util';

export type UserListViewRow = {
  readonly created_at: string;
  readonly display_name: string;
  readonly enabled: boolean;
  readonly id: string;
  readonly role_names: readonly string[];
  readonly username: string;
};

/** Backs the `/cqms/admin/users` list (ADR-024). */
export const getUserListView = async (): Promise<
  readonly UserListViewRow[]
> => {
  const pool = getPool();
  const result = await pool.query<UserListViewRow>(
    `SELECT u.id, u.username, u.display_name, u.enabled, u.created_at,
            coalesce(
              (SELECT array_agg(r.role_name ORDER BY r.role_name)
               FROM cqms.v_user_roles ur
               JOIN cqms.v_roles r ON r.id = ur.role_id
               WHERE ur.user_id = u.id),
              '{}'
            ) AS role_names
     FROM cqms.v_users u
     ORDER BY u.username`,
  );
  return result.rows;
};
