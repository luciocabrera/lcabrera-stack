import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import {
  deriveWorkspaces,
  deriveWorkspaceScopes,
  workspacesForFiles,
} from './workspace-scopes.mjs';

const scaffold = (yaml, workspaceDirs) => {
  const root = mkdtempSync(join(tmpdir(), 'workspace-scopes-'));
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
      deriveWorkspaces(root).sort((a, b) => a.name.localeCompare(b.name)),
    ).toEqual([
      { kind: 'pkg', name: 'api' },
      { kind: 'app', name: 'site' },
      { kind: 'pkg', name: 'ui' },
    ]);
  });

  it('accepts a literal entry, and skips one with no manifest', () => {
    const root = scaffold('packages:\n  - packages/ui\n  - packages/ghost\n', [
      'packages/ui',
    ]);
    expect(deriveWorkspaces(root)).toEqual([{ kind: 'pkg', name: 'ui' }]);
  });

  it('is empty when the roster file is absent, rather than throwing', () => {
    const root = mkdtempSync(join(tmpdir(), 'workspace-scopes-'));
    expect(deriveWorkspaces(root)).toEqual([]);
    expect(deriveWorkspaceScopes(root).size).toBe(0);
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
    { kind: 'pkg', name: 'ui' },
    { kind: 'app', name: 'site' },
  ];

  it('maps a changed file to the workspace whose directory holds it', () => {
    expect(workspacesForFiles(['packages/ui/src/x.ts'], workspaces)).toEqual([
      { kind: 'pkg', name: 'ui' },
    ]);
    expect(workspacesForFiles(['apps/site/app.tsx'], workspaces)).toEqual([
      { kind: 'app', name: 'site' },
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
