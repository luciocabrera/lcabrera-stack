import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { registerProject } from './registerProject.util.ts';

describe('registerProject', () => {
  const createdProjectPaths: string[] = [];

  afterAll(async () => {
    const pool = getPool();
    for (const localPath of createdProjectPaths) {
      await pool.query('DELETE FROM cqms.projects WHERE local_path = $1', [
        localPath,
      ]);
      rmSync(localPath, { force: true, recursive: true });
    }
    await closePool();
  });

  it('registers a new project at its canonicalized path', async () => {
    const projectDir = realpathSync(
      mkdtempSync(join(tmpdir(), 'scan-ingestion-register-')),
    );
    createdProjectPaths.push(projectDir);

    const result = await registerProject({
      localPath: projectDir,
      name: 'register-test-project',
    });

    expect(result.projectId).toBeTruthy();

    const pool = getPool();
    const row = await pool.query<{ local_path: string; name: string }>(
      'SELECT name, local_path FROM cqms.projects WHERE id = $1',
      [result.projectId],
    );

    expect(row.rows[0]?.name).toBe('register-test-project');
    expect(row.rows[0]?.local_path).toBe(projectDir);
  });

  it('rejects a path that does not exist', async () => {
    await expect(
      registerProject({
        localPath: '/does/not/exist/at/all',
        name: 'nope',
      }),
    ).rejects.toThrow(/does not exist/);
  });

  it('upserts (not duplicates) when the same local_path is registered twice', async () => {
    const projectDir = realpathSync(
      mkdtempSync(join(tmpdir(), 'scan-ingestion-register-')),
    );
    createdProjectPaths.push(projectDir);

    const first = await registerProject({
      localPath: projectDir,
      name: 'first-name',
    });
    const second = await registerProject({
      localPath: projectDir,
      name: 'second-name',
    });

    expect(second.projectId).toBe(first.projectId);
  });

  it("registers a real subfolder of a git repo as its own distinct project, not that repo's root", async () => {
    const repoRoot = realpathSync(
      mkdtempSync(join(tmpdir(), 'scan-ingestion-register-repo-')),
    );
    execFileSync('git', ['init'], { cwd: repoRoot });
    const subfolder = join(repoRoot, 'packages', 'some-package');
    mkdirSync(subfolder, { recursive: true });

    try {
      const result = await registerProject({
        localPath: subfolder,
        name: 'subfolder-project',
      });

      const pool = getPool();
      const row = await pool.query<{ local_path: string }>(
        'SELECT local_path FROM cqms.projects WHERE id = $1',
        [result.projectId],
      );

      expect(row.rows[0]?.local_path).toBe(subfolder);
      expect(row.rows[0]?.local_path).not.toBe(repoRoot);

      await pool.query('DELETE FROM cqms.projects WHERE id = $1', [
        result.projectId,
      ]);
    } finally {
      rmSync(repoRoot, { force: true, recursive: true });
    }
  });
});
