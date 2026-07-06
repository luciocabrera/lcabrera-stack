import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { makeDirectoryWithin } from '@repo/scan-ingestion/fs/makeDirectoryWithin.util.ts';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { updateProject } from './updateProject.util.ts';

describe('updateProject', () => {
  let projectDir: string;
  let otherDir: string;
  let projectId: string;

  beforeAll(async () => {
    projectDir = makeTempDirectory('scan-ingestion-update-');
    otherDir = makeTempDirectory('scan-ingestion-update-other-');

    const pool = getPool();
    const result = await pool.query<{ fn_upsert_project: string }>(
      'SELECT cqms.fn_upsert_project($1, $2) AS fn_upsert_project',
      ['update-test-project', projectDir],
    );
    projectId = result.rows[0]?.fn_upsert_project ?? '';
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
    rmSync(otherDir, { force: true, recursive: true });
  });

  it('updates the name and local_path of an existing project', async () => {
    await updateProject({
      localPath: otherDir,
      name: 'renamed-project',
      projectId,
    });

    const pool = getPool();
    const row = await pool.query<{ local_path: string; name: string }>(
      'SELECT name, local_path FROM cqms.projects WHERE id = $1',
      [projectId],
    );

    expect(row.rows[0]?.name).toBe('renamed-project');
    expect(row.rows[0]?.local_path).toBe(otherDir);
  });

  it('rejects a path that does not exist', async () => {
    await expect(
      updateProject({
        localPath: '/does/not/exist/at/all',
        name: 'nope',
        projectId,
      }),
    ).rejects.toThrow(/does not exist/);
  });

  it('rejects an unknown project id', async () => {
    await expect(
      updateProject({
        localPath: projectDir,
        name: 'nope',
        projectId: '00000000-0000-0000-0000-000000000000',
      }),
    ).rejects.toThrow(/not found/);
  });

  it("updates local_path to a real subfolder of a git repo, not that repo's root", async () => {
    const repoRoot = makeTempDirectory('scan-ingestion-update-repo-');
    execFileSync('git', ['init'], { cwd: repoRoot });
    const subfolder = makeDirectoryWithin({
      baseDirectory: repoRoot,
      targetPath: path.join('packages', 'some-package'),
    });

    try {
      await updateProject({
        localPath: subfolder,
        name: 're-pathed-project',
        projectId,
      });

      const pool = getPool();
      const row = await pool.query<{ local_path: string }>(
        'SELECT local_path FROM cqms.projects WHERE id = $1',
        [projectId],
      );

      expect(row.rows[0]?.local_path).toBe(subfolder);
      expect(row.rows[0]?.local_path).not.toBe(repoRoot);
    } finally {
      rmSync(repoRoot, { force: true, recursive: true });
    }
  });
});
