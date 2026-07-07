import { getPool } from '@repo/data-access/db/getPool.util';

export type UserWithRoles = {
  readonly created_at: string;
  readonly display_name: string;
  readonly enabled: boolean;
  readonly id: string;
  readonly role_ids: readonly string[];
  readonly role_names: readonly string[];
  readonly username: string;
};

type GetUserWithRolesArgs = {
  readonly username: string;
};

/**
 * One user plus their role assignments, keyed by username — the admin UI's
 * routes use the username as the human-readable row id (ADR-024), the same
 * way the scanner registry uses scanner_id. Includes disabled users (the
 * edit page is how they get re-enabled); soft-deleted ones stay invisible
 * (v_users filters them).
 */
export const getUserWithRoles = async ({
  username,
}: GetUserWithRolesArgs): Promise<undefined | UserWithRoles> => {
  const pool = getPool();
  const result = await pool.query<UserWithRoles>(
    `SELECT u.id, u.username, u.display_name, u.enabled, u.created_at,
            coalesce(
              (SELECT array_agg(ur.role_id ORDER BY r.role_name)
               FROM cqms.v_user_roles ur
               JOIN cqms.v_roles r ON r.id = ur.role_id
               WHERE ur.user_id = u.id),
              '{}'
            ) AS role_ids,
            coalesce(
              (SELECT array_agg(r.role_name ORDER BY r.role_name)
               FROM cqms.v_user_roles ur
               JOIN cqms.v_roles r ON r.id = ur.role_id
               WHERE ur.user_id = u.id),
              '{}'
            ) AS role_names
     FROM cqms.v_users u
     WHERE u.username = $1`,
    [username],
  );
  return result.rows[0];
};
