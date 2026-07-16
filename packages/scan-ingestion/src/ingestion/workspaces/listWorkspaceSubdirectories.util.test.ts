import { makeDirectoryWithin } from '@repo/scan-ingestion/fs/makeDirectoryWithin.util.ts';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { listWorkspaceSubdirectories } from './listWorkspaceSubdirectories.util.ts';

describe('listWorkspaceSubdirectories', () => {
  let rootPath: string;

  beforeEach(() => {
    rootPath = makeTempDirectory('scan-ingestion-subdirs-');
  });

  afterEach(() => {
    rmSync(rootPath, { force: true, recursive: true });
  });

  it('lists directories, skipping node_modules', () => {
    makeDirectoryWithin({ baseDirectory: rootPath, targetPath: 'apps/web' });
    makeDirectoryWithin({ baseDirectory: rootPath, targetPath: 'apps/api' });
    makeDirectoryWithin({
      baseDirectory: rootPath,
      targetPath: 'apps/node_modules',
    });

    expect(
      listWorkspaceSubdirectories({ relativePath: 'apps', rootPath }).toSorted(
        (left, right) => left.localeCompare(right),
      ),
    ).toEqual(['api', 'web']);
  });

  it("lists the root itself for relativePath '' and degrades missing dirs to []", () => {
    makeDirectoryWithin({ baseDirectory: rootPath, targetPath: 'apps' });

    expect(listWorkspaceSubdirectories({ relativePath: '', rootPath })).toEqual(
      ['apps'],
    );
    expect(
      listWorkspaceSubdirectories({ relativePath: 'missing', rootPath }),
    ).toEqual([]);
  });
});
