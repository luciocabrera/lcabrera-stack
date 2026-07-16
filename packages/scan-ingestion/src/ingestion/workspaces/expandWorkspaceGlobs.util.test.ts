import { makeDirectoryWithin } from '@repo/scan-ingestion/fs/makeDirectoryWithin.util.ts';
import { writeTextFileWithin } from '@repo/scan-ingestion/fs/writeTextFileWithin.util.ts';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { expandWorkspaceGlobs } from './expandWorkspaceGlobs.util.ts';

type AddPackageArgs = {
  readonly relativePath: string;
  readonly rootPath: string;
};

const addPackage = ({ relativePath, rootPath }: AddPackageArgs) => {
  makeDirectoryWithin({ baseDirectory: rootPath, targetPath: relativePath });
  writeTextFileWithin({
    baseDirectory: rootPath,
    content: JSON.stringify({ name: relativePath }),
    targetPath: path.posix.join(relativePath, 'package.json'),
  });
};

describe('expandWorkspaceGlobs', () => {
  let rootPath: string;

  beforeEach(() => {
    rootPath = makeTempDirectory('scan-ingestion-workspaces-');
  });

  afterEach(() => {
    rmSync(rootPath, { force: true, recursive: true });
  });

  it('expands star segments to directories that contain a package.json', () => {
    addPackage({ relativePath: 'apps/web', rootPath });
    addPackage({ relativePath: 'apps/api', rootPath });
    // A directory WITHOUT package.json does not qualify.
    makeDirectoryWithin({ baseDirectory: rootPath, targetPath: 'apps/docs' });
    addPackage({ relativePath: 'packages/ui', rootPath });

    expect(
      expandWorkspaceGlobs({
        globs: ['apps/*', 'packages/*'],
        rootPath,
      }),
    ).toEqual(['apps/api', 'apps/web', 'packages/ui']);
  });

  it('supports exact paths, negations, and skips node_modules', () => {
    addPackage({ relativePath: 'apps/web', rootPath });
    addPackage({ relativePath: 'apps/legacy', rootPath });
    addPackage({ relativePath: 'apps/node_modules/sneaky', rootPath });
    addPackage({ relativePath: 'tools/scripts', rootPath });

    expect(
      expandWorkspaceGlobs({
        globs: ['apps/*', 'tools/scripts', '!apps/legacy'],
        rootPath,
      }),
    ).toEqual(['apps/web', 'tools/scripts']);
  });

  it('deduplicates overlapping globs and ignores missing paths', () => {
    addPackage({ relativePath: 'apps/web', rootPath });

    expect(
      expandWorkspaceGlobs({
        globs: ['apps/*', 'apps/web', 'does-not-exist/*'],
        rootPath,
      }),
    ).toEqual(['apps/web']);
  });
});
