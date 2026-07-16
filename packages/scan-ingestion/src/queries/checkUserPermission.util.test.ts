import { hashSecret } from '@repo/data-access/crypto/hashSecret.util';
import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { checkUserPermission } from './checkUserPermission.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';

describe('checkUserPermission', () => {
  let viewerUserId: string;
  let projectId: string;
  let systemUserId: string;

  beforeAll(async () => {
    const pool = getPool();
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';
    const created = await pool.query<{ id: string }>(
      `INSERT INTO cqms.users (username, display_name, password_hash)
       VALUES ($1, $2, $3) RETURNING id`,
      [
        'perm-test-viewer',
        'Perm Test Viewer',
        hashSecret({ secret: 'irrelevant' }),
      ],
    );
    viewerUserId = created.rows[0]?.id ?? '';

    await pool.query(
      `INSERT INTO cqms.user_roles (user_id, role_id)
       SELECT $1, id FROM cqms.roles WHERE role_name = 'viewer'`,
      [viewerUserId],
    );

    const project = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'perm-test-project'],
    );
    projectId = project.rows[0]?.fn_register_project ?? '';
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await pool.query('DELETE FROM cqms.users WHERE id = $1', [viewerUserId]);
    await closePool();
  });

  it('allows a viewer to read projects (role permission)', async () => {
    const result = await checkUserPermission({
      action: 'read',
      resourceType: 'project',
      userId: viewerUserId,
    });

    expect(result).toEqual({ allowed: true });
  });

  it('denies a viewer executing scans, with the DB reason', async () => {
    const result = await checkUserPermission({
      action: 'execute',
      resourceType: 'scan',
      userId: viewerUserId,
    });

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toContain('perm-test-viewer');
      expect(result.reason).toContain('execute');
    }
  });

  it('allows via a per-instance grant on one specific resource', async () => {
    const pool = getPool();
    await pool.query(
      `INSERT INTO cqms.resource_grants (grantee_user_id, action, resource_type, resource_id)
       VALUES ($1, 'execute', 'scan', $2)`,
      [viewerUserId, projectId],
    );

    const granted = await checkUserPermission({
      action: 'execute',
      resourceId: projectId,
      resourceType: 'scan',
      userId: viewerUserId,
    });
    const otherResource = await checkUserPermission({
      action: 'execute',
      resourceId: '00000000-0000-0000-0000-000000000000',
      resourceType: 'scan',
      userId: viewerUserId,
    });

    expect(granted).toEqual({ allowed: true });
    expect(otherResource.allowed).toBe(false);
  });

  it('denies an unknown user', async () => {
    const result = await checkUserPermission({
      action: 'read',
      resourceType: 'project',
      userId: '00000000-0000-0000-0000-000000000000',
    });

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toContain('unknown user');
    }
  });
});
