import { makeDirectoryWithin } from '@repo/scan-ingestion/fs/makeDirectoryWithin.util.ts';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { expandWorkspaceGlobSegments } from './expandWorkspaceGlobSegments.util.ts';

describe('expandWorkspaceGlobSegments', () => {
  let rootPath: string;

  beforeEach(() => {
    rootPath = makeTempDirectory('scan-ingestion-segments-');
  });

  afterEach(() => {
    rmSync(rootPath, { force: true, recursive: true });
  });

  it('fans a star segment out over subdirectories, literals must exist', () => {
    makeDirectoryWithin({
      baseDirectory: rootPath,
      targetPath: 'packages/a/plugins',
    });
    makeDirectoryWithin({ baseDirectory: rootPath, targetPath: 'packages/b' });

    expect(
      expandWorkspaceGlobSegments({
        baseRelative: '',
        rootPath,
        segments: ['packages', '*', 'plugins'],
      }),
    ).toEqual(['packages/a/plugins']);

    expect(
      expandWorkspaceGlobSegments({
        baseRelative: '',
        rootPath,
        segments: ['packages', 'missing'],
      }),
    ).toEqual([]);
  });
});
