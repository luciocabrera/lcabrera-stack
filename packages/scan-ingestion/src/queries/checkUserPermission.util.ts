import { getPool } from '@lcabrera/server/db/get-pool.util';

const INSUFFICIENT_PRIVILEGE = '42501';

export type PermissionAction =
  | 'create'
  | 'delete'
  | 'execute'
  | 'read'
  | 'update';

export type PermissionCheckResult =
  | { readonly allowed: false; readonly reason: string }
  | { readonly allowed: true };

export type PermissionResourceType =
  | 'project'
  | 'role'
  | 'run'
  | 'scan'
  | 'scanner'
  | 'user'
  | 'workspace';

type CheckUserPermissionArgs = {
  readonly action: PermissionAction;
  readonly resourceId?: string;
  readonly resourceType: PermissionResourceType;
  readonly userId: string;
};

const isInsufficientPrivilegeError = (
  error: unknown,
): error is { readonly code: string; readonly message: string } =>
  typeof error === 'object' &&
  error !== null &&
  (error as { code?: unknown }).code === INSUFFICIENT_PRIVILEGE;

/**
 * Non-throwing TS face of cqms.fn_assert_permission (ADR-017) — the same
 * deny-by-default gate the write functions call internally from migration
 * 0009 onward. UI route gating wants a boolean plus the DB's own
 * human-readable reason, not an exception; anything other than a 42501
 * (genuine DB failure) still throws.
 */
export const checkUserPermission = async ({
  action,
  resourceId,
  resourceType,
  userId,
}: CheckUserPermissionArgs): Promise<PermissionCheckResult> => {
  const pool = getPool();
  try {
    // node-postgres serializes an undefined parameter as SQL NULL, which
    // hits fn_assert_permission's DEFAULT NULL resource id.
    await pool.query('SELECT cqms.fn_assert_permission($1, $2, $3, $4)', [
      userId,
      action,
      resourceType,
      resourceId,
    ]);
    return { allowed: true };
  } catch (error) {
    if (isInsufficientPrivilegeError(error)) {
      return { allowed: false, reason: error.message };
    }
    throw error;
  }
};
