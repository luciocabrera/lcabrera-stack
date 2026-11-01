import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { readWorkspaceGraph, resolveAffected } from './affected-tests.mjs';
import { mutationRoots } from './fallow-gate.mjs';
import { createFixtureRoots } from './repo-fixtures.mjs';
import {
  deriveWorkspaces,
  deriveWorkspaceScopes,
  workspacesForFiles,
} from './workspace-scopes.mjs';

const roots = createFixtureRoots('workspace-scopes-');

afterEach(roots.removeAll);

const scaffold = (yaml, workspaceDirs) => {
  const root = roots.make();
  writeFileSync(join(root, 'pnpm-workspace.yaml'), yaml);
  for (const dir of workspaceDirs) {
    mkdirSync(join(root, dir), { recursive: true });
    writeFileSync(join(root, dir, 'package.json'), '{}');
  }
  return root;
};

describe('deriveWorkspaces', () => {
  it('expands a star glob and tags each workspace by its directory', () => {
    const root = scaffold('packages:\n  - apps/*\n  - packages/*\n', [
      'apps/site',
      'packages/ui',
      'packages/api',
    ]);
    expect(
      deriveWorkspaces(root).toSorted((a, b) => a.name.localeCompare(b.name)),
    ).toEqual([
      { dir: 'packages/api', kind: 'pkg', name: 'api' },
      { dir: 'apps/site', kind: 'app', name: 'site' },
      { dir: 'packages/ui', kind: 'pkg', name: 'ui' },
    ]);
  });

  it('accepts a literal entry, and skips one with no manifest', () => {
    const root = scaffold('packages:\n  - packages/ui\n  - packages/ghost\n', [
      'packages/ui',
    ]);
    expect(deriveWorkspaces(root)).toEqual([
      { dir: 'packages/ui', kind: 'pkg', name: 'ui' },
    ]);
  });

  it('keeps the directory each glob matched, outside apps/ and packages/ and nested', () => {
    const root = scaffold(
      'packages:\n  - tools/*\n  - packages/group/*\n  - libs/core/\n',
      ['tools/cli', 'packages/group/alpha', 'libs/core'],
    );
    expect(deriveWorkspaces(root).map(({ dir }) => dir)).toEqual([
      'tools/cli',
      'packages/group/alpha',
      'libs/core',
    ]);
  });

  it('is empty when the roster file is absent, rather than throwing', () => {
    const root = roots.make();
    expect(deriveWorkspaces(root)).toEqual([]);
    expect(deriveWorkspaceScopes(root).size).toBe(0);
  });
});

const layout = () => {
  const root = roots.make();
  writeFileSync(
    join(root, 'pnpm-workspace.yaml'),
    'packages:\n  - tools/*\n  - packages/group/*\n',
  );
  for (const [dir, name] of [
    ['tools/cli', '@scratch/cli'],
    ['packages/group/alpha', '@scratch/alpha'],
  ]) {
    mkdirSync(join(root, dir), { recursive: true });
    writeFileSync(join(root, dir, 'package.json'), JSON.stringify({ name }));
  }
  return root;
};

describe('readWorkspaceGraph over a layout outside apps/ and packages/', () => {
  it('reads each manifest from the directory its glob matched', () => {
    expect(
      readWorkspaceGraph(layout()).map(({ dir, pkgName }) => [dir, pkgName]),
    ).toEqual([
      ['tools/cli', '@scratch/cli'],
      ['packages/group/alpha', '@scratch/alpha'],
    ]);
  });

  it('lets resolveAffected select a workspace under tools/ and a nested one', () => {
    const graph = readWorkspaceGraph(layout());
    expect(
      resolveAffected({
        files: ['tools/cli/src/a.ts'],
        globalPackages: ['@scratch/none'],
        graph,
      }),
    ).toMatchObject({ changed: ['@scratch/cli'], mode: 'scoped' });
    expect(
      resolveAffected({
        files: ['packages/group/alpha/src/b.ts'],
        globalPackages: ['@scratch/none'],
        graph,
      }),
    ).toMatchObject({ changed: ['@scratch/alpha'], mode: 'scoped' });
  });

  it('labels the same workspaces from their real directories', () => {
    expect(
      workspacesForFiles(
        ['tools/cli/src/a.ts', 'packages/group/alpha/src/b.ts'],
        deriveWorkspaces(layout()),
      ).map(({ name }) => name),
    ).toEqual(['cli', 'alpha']);
  });

  it('roots a mutation run in each of those directories, leaving nothing outside', () => {
    const workspaceDirs = readWorkspaceGraph(layout()).map(({ dir }) => dir);
    expect(
      mutationRoots({
        files: ['tools/cli/src/a.ts', 'packages/group/alpha/src/b.ts'],
        workspaceDirs,
      }),
    ).toEqual({
      outside: [],
      roots: [
        {
          files: ['packages/group/alpha/src/b.ts'],
          root: 'packages/group/alpha',
        },
        { files: ['tools/cli/src/a.ts'], root: 'tools/cli' },
      ],
    });
  });
});

describe('deriveWorkspaceScopes', () => {
  it('narrows the roster to bare names', () => {
    const root = scaffold('packages:\n  - packages/*\n', ['packages/ui']);
    expect([...deriveWorkspaceScopes(root)]).toEqual(['ui']);
  });
});

describe('workspacesForFiles', () => {
  const workspaces = [
    { dir: 'packages/ui', kind: 'pkg', name: 'ui' },
    { dir: 'apps/site', kind: 'app', name: 'site' },
  ];

  it('maps a changed file to the workspace whose directory holds it', () => {
    expect(workspacesForFiles(['packages/ui/src/x.ts'], workspaces)).toEqual([
      workspaces[0],
    ]);
    expect(workspacesForFiles(['apps/site/app.tsx'], workspaces)).toEqual([
      workspaces[1],
    ]);
  });

  it('does not match a name that merely shares a prefix', () => {
    expect(workspacesForFiles(['packages/ui-kit/x.ts'], workspaces)).toEqual(
      [],
    );
  });

  it('is empty for a root-level file that belongs to no workspace', () => {
    expect(workspacesForFiles(['README.md'], workspaces)).toEqual([]);
  });
});
