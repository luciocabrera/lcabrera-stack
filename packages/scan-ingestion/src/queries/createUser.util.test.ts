import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { authenticateUser } from './authenticateUser.util.ts';
import { checkUserPermission } from './checkUserPermission.util.ts';
import { createResourceGrant } from './createResourceGrant.util.ts';
import { createRole } from './createRole.util.ts';
import { createUser } from './createUser.util.ts';
import { deleteResourceGrant } from './deleteResourceGrant.util.ts';
import { getAllPermissions } from './getAllPermissions.util.ts';
import { getProjectGrants } from './getProjectGrants.util.ts';
import { getRoleListView } from './getRoleListView.util.ts';
import { getRoleWithPermissions } from './getRoleWithPermissions.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { getUserWithRoles } from './getUserWithRoles.util.ts';
import { replaceRolePermissions } from './replaceRolePermissions.util.ts';
import { replaceUserRoles } from './replaceUserRoles.util.ts';
import { setUserPassword } from './setUserPassword.util.ts';
import { triggerScan } from './triggerScan.util.ts';
import { updateUser } from './updateUser.util.ts';

const TEST_USERNAME = 'zz-mgmt-user';
const TEST_ROLE_NAME = 'zz-mgmt-role';

describe('user/role management (ADR-024, real DB)', () => {
  let managedUserId: string;
  let projectDir: string;
  let projectId: string;
  let systemUserId: string;
  let viewerRoleId: string;

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-mgmt-');
    const pool = getPool();
    const projectResult = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'mgmt-e2e-project'],
    );
    projectId = projectResult.rows[0]?.fn_register_project ?? '';

    // Triggering requires a synced snapshot (0027) — record one
    // pointing at the temp dir.
    await pool.query(
      'SELECT * FROM cqms.fn_set_project_snapshot($1, $2, $3, $4, $5, $6, $7)',
      [systemUserId, projectId, projectDir, 'test.zip', 42, 1, 'test'],
    );

    const roles = await getRoleListView();
    viewerRoleId = roles.find((role) => role.role_name === 'viewer')?.id ?? '';
  });

  afterAll(async () => {
    const pool = getPool();
    // Project first: its runs/scans reference the managed user via
    // created_by (no cascade there — only the project cascade removes
    // them). user_roles/resource_grants then cascade from the user row.
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await pool.query('DELETE FROM cqms.users WHERE username = $1', [
      TEST_USERNAME,
    ]);
    await pool.query('DELETE FROM cqms.roles WHERE role_name = $1', [
      TEST_ROLE_NAME,
    ]);
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('creates a loginable user and assigns the viewer role', async () => {
    const { createdUserId } = await createUser({
      displayName: 'Mgmt Test User',
      password: 'initial-password',
      userId: systemUserId,
      username: TEST_USERNAME,
    });
    managedUserId = createdUserId;

    expect(
      await authenticateUser({
        password: 'initial-password',
        username: TEST_USERNAME,
      }),
    ).toMatchObject({ username: TEST_USERNAME });

    await replaceUserRoles({
      roleIds: [viewerRoleId],
      targetUserId: managedUserId,
      userId: systemUserId,
    });
    const withRoles = await getUserWithRoles({ username: TEST_USERNAME });
    expect(withRoles?.role_names).toEqual(['viewer']);

    await expect(
      createUser({
        displayName: 'Dup',
        password: 'x'.repeat(12),
        userId: systemUserId,
        username: TEST_USERNAME,
      }),
    ).rejects.toThrow(/already exists/);
  });

  it('viewer is read-only: management and scan triggering are denied', async () => {
    expect(
      await checkUserPermission({
        action: 'read',
        resourceType: 'project',
        userId: managedUserId,
      }),
    ).toEqual({ allowed: true });
    expect(
      await checkUserPermission({
        action: 'execute',
        resourceType: 'scan',
        userId: managedUserId,
      }),
    ).toMatchObject({ allowed: false });

    await expect(
      createUser({
        displayName: 'Sneaky',
        password: 'irrelevant-pass',
        userId: managedUserId,
        username: 'zz-sneaky',
      }),
    ).rejects.toThrow(/Permission denied/);

    await expect(
      triggerScan({
        projectId,
        scannerIds: ['eslint'],
        userId: managedUserId,
      }),
    ).rejects.toThrow(/Permission denied/);
  });

  it('a per-instance execute/scan grant on the project opens exactly that door', async () => {
    const { grantId } = await createResourceGrant({
      action: 'execute',
      granteeUserId: managedUserId,
      resourceId: projectId,
      resourceType: 'scan',
      userId: systemUserId,
    });

    const grants = await getProjectGrants({ projectId });
    expect(grants).toHaveLength(1);
    expect(grants[0]).toMatchObject({
      action: 'execute',
      resource_type: 'scan',
      username: TEST_USERNAME,
    });

    const { runId } = await triggerScan({
      projectId,
      scannerIds: ['eslint'],
      userId: managedUserId,
    });
    expect(runId).toBeTruthy();

    await deleteResourceGrant({ grantId, userId: systemUserId });
    expect(await getProjectGrants({ projectId })).toEqual([]);
    await expect(
      triggerScan({
        projectId,
        scannerIds: ['eslint'],
        userId: managedUserId,
      }),
    ).rejects.toThrow(/Permission denied/);
  });

  it('password changes: self-service allowed, system account refused', async () => {
    await setUserPassword({
      password: 'rotated-password',
      targetUserId: managedUserId,
      userId: managedUserId,
    });

    expect(
      await authenticateUser({
        password: 'initial-password',
        username: TEST_USERNAME,
      }),
    ).toBeUndefined();
    expect(
      await authenticateUser({
        password: 'rotated-password',
        username: TEST_USERNAME,
      }),
    ).toMatchObject({ username: TEST_USERNAME });

    await expect(
      setUserPassword({
        password: 'never-loginable',
        targetUserId: systemUserId,
        userId: systemUserId,
      }),
    ).rejects.toThrow(/non-loginable/);
  });

  it('lockout guards hold: own account, system roles, admin role', async () => {
    await expect(
      updateUser({
        isEnabled: false,
        targetUserId: systemUserId,
        userId: systemUserId,
      }),
    ).rejects.toThrow(/cannot disable your own account/);

    await expect(
      replaceUserRoles({
        roleIds: [],
        targetUserId: systemUserId,
        userId: systemUserId,
      }),
    ).rejects.toThrow(/roles are fixed|admin role/);

    const roles = await getRoleListView();
    const adminRoleId = roles.find((role) => role.role_name === 'admin')?.id;
    await expect(
      replaceRolePermissions({
        permissionIds: [],
        roleId: adminRoleId ?? '',
        userId: systemUserId,
      }),
    ).rejects.toThrow(/fixed/);
  });

  it('custom roles: create, assign permissions, disable', async () => {
    const { roleId } = await createRole({
      description: 'Management-test role.',
      roleName: TEST_ROLE_NAME,
      userId: systemUserId,
    });

    const permissions = await getAllPermissions();
    const readProject = permissions.find(
      (permission) =>
        permission.action === 'read' && permission.resource_type === 'project',
    );
    await replaceRolePermissions({
      permissionIds: [readProject?.id ?? ''],
      roleId,
      userId: systemUserId,
    });

    const role = await getRoleWithPermissions({ roleName: TEST_ROLE_NAME });
    expect(role?.permission_ids).toEqual([readProject?.id]);

    await expect(
      replaceRolePermissions({
        permissionIds: ['00000000-0000-0000-0000-000000000000'],
        roleId,
        userId: systemUserId,
      }),
    ).rejects.toThrow(/Unknown permission/);
  });
});
