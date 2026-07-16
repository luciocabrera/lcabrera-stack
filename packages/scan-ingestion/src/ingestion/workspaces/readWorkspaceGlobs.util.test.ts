import { writeTextFileWithin } from '@repo/scan-ingestion/fs/writeTextFileWithin.util.ts';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readWorkspaceGlobs } from './readWorkspaceGlobs.util.ts';

describe('readWorkspaceGlobs', () => {
  let rootPath: string;

  beforeEach(() => {
    rootPath = makeTempDirectory('scan-ingestion-globs-');
  });

  afterEach(() => {
    rmSync(rootPath, { force: true, recursive: true });
  });

  it('prefers pnpm-workspace.yaml over package.json workspaces', () => {
    writeTextFileWithin({
      baseDirectory: rootPath,
      content: 'packages:\n  - apps/*\n',
      targetPath: 'pnpm-workspace.yaml',
    });
    writeTextFileWithin({
      baseDirectory: rootPath,
      content: JSON.stringify({ workspaces: ['ignored/*'] }),
      targetPath: 'package.json',
    });

    expect(readWorkspaceGlobs(rootPath)).toEqual(['apps/*']);
  });

  it('falls back to package.json and throws when neither file is readable', () => {
    writeTextFileWithin({
      baseDirectory: rootPath,
      content: JSON.stringify({ workspaces: ['libs/*'] }),
      targetPath: 'package.json',
    });
    expect(readWorkspaceGlobs(rootPath)).toEqual(['libs/*']);

    rmSync(rootPath, { force: true, recursive: true });
    expect(() => readWorkspaceGlobs(rootPath)).toThrow();
  });
});
