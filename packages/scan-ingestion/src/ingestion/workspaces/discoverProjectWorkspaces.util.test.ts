import { makeDirectoryWithin } from '@repo/scan-ingestion/fs/makeDirectoryWithin.util.ts';
import { writeTextFileWithin } from '@repo/scan-ingestion/fs/writeTextFileWithin.util.ts';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { discoverProjectWorkspaces } from './discoverProjectWorkspaces.util.ts';

type AddPackageArgs = {
  readonly name?: string;
  readonly relativePath: string;
  readonly rootPath: string;
};

const addPackage = ({ name, relativePath, rootPath }: AddPackageArgs) => {
  makeDirectoryWithin({ baseDirectory: rootPath, targetPath: relativePath });
  writeTextFileWithin({
    baseDirectory: rootPath,
    content: JSON.stringify(name ? { name } : {}),
    targetPath: path.posix.join(relativePath, 'package.json'),
  });
};

describe('discoverProjectWorkspaces', () => {
  let rootPath: string;

  beforeEach(() => {
    rootPath = makeTempDirectory('scan-ingestion-discover-');
  });

  afterEach(() => {
    rmSync(rootPath, { force: true, recursive: true });
  });

  it('prefers pnpm-workspace.yaml and pairs paths with package names', () => {
    writeTextFileWithin({
      baseDirectory: rootPath,
      content: 'packages:\n  - apps/*\ncatalog:\n  react: ^19.0.0\n',
      targetPath: 'pnpm-workspace.yaml',
    });
    addPackage({ name: '@repo/web', relativePath: 'apps/web', rootPath });
    addPackage({ relativePath: 'apps/nameless', rootPath });

    expect(discoverProjectWorkspaces({ rootPath })).toEqual([
      { workspace_name: undefined, workspace_path: 'apps/nameless' },
      { workspace_name: '@repo/web', workspace_path: 'apps/web' },
    ]);
  });

  it('falls back to package.json workspaces', () => {
    writeTextFileWithin({
      baseDirectory: rootPath,
      content: JSON.stringify({ name: 'root', workspaces: ['libs/*'] }),
      targetPath: 'package.json',
    });
    addPackage({ name: '@acme/core', relativePath: 'libs/core', rootPath });

    expect(discoverProjectWorkspaces({ rootPath })).toEqual([
      { workspace_name: '@acme/core', workspace_path: 'libs/core' },
    ]);
  });

  it('yields [] for a plain single-package repo and for unreadable roots', () => {
    writeTextFileWithin({
      baseDirectory: rootPath,
      content: JSON.stringify({ name: 'plain' }),
      targetPath: 'package.json',
    });
    expect(discoverProjectWorkspaces({ rootPath })).toEqual([]);

    expect(
      discoverProjectWorkspaces({ rootPath: path.join(rootPath, 'missing') }),
    ).toEqual([]);
  });
});
