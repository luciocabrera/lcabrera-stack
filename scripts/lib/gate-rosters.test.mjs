/**
 * The rosters this repository declares are the ones its gates actually run on.
 *
 * The gates that read them take them as arguments now, so a unit test can hand
 * over a fixture and pass while `devkit.config.json` names something that has
 * moved, been renamed or never existed — the same shape that let the review-gate
 * roster keep a path to a script that was no longer there. These assert the real
 * config against the real tree, and they live here rather than beside the gates
 * because what they read is this repository's own data.
 */
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import {
  readWorkspaceGraph,
  resolveAffected,
} from '../../packages/repo-standards/scripts/affected-tests.mjs';
import { readGates } from '../../packages/repo-standards/scripts/config.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const GATES = readGates(REPO_ROOT);
const GRAPH = readWorkspaceGraph(REPO_ROOT);

const WORKSPACE_ROOTS = ['apps', 'packages'];

const inventoriesInTree = () =>
  WORKSPACE_ROOTS.flatMap((root) =>
    readdirSync(join(REPO_ROOT, root), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `${root}/${entry.name}/src/INVENTORY.md`)
      .filter((file) => existsSync(join(REPO_ROOT, file))),
  ).sort((left, right) => left.localeCompare(right));

describe('gates.inventory.trees', () => {
  const { trees } = GATES.inventory;

  it('governs every inventory the repository actually holds', () => {
    expect(
      trees
        .map((tree) => tree.inventory)
        .sort((left, right) => left.localeCompare(right)),
    ).toEqual(inventoriesInTree());
  });

  it('points every entry at a directory and a file that exist', () => {
    const missing = trees.flatMap(({ inventory, root }) => [
      ...(existsSync(join(REPO_ROOT, root)) ? [] : [root]),
      ...(existsSync(join(REPO_ROOT, inventory)) ? [] : [inventory]),
    ]);
    expect(missing).toEqual([]);
  });
});

describe('gates.affectedTests.globalPackages', () => {
  const { globalPackages, lintOnlyPatterns } = GATES.affectedTests;

  const dirOf = (pkgName) =>
    GRAPH.find((workspace) => workspace.pkgName === pkgName)?.dir;

  it('names only workspaces this repository has', () => {
    const unknown = globalPackages.filter(
      (pkgName) => dirOf(pkgName) === undefined,
    );
    expect(unknown).toEqual([]);
  });

  it('is what the selection gate runs on — each one forces the full suite', () => {
    expect(globalPackages.length).toBeGreaterThan(0);
    for (const pkgName of globalPackages) {
      const result = resolveAffected({
        files: [`${dirOf(pkgName)}/src/probe.ts`],
        globalPackages,
        graph: GRAPH,
        lintOnlyPatterns,
      });
      expect(result.mode).toBe('full');
    }
  });

  it('leaves an ordinary workspace scoped, so `full` means something', () => {
    const ordinary = GRAPH.find(
      (workspace) => !globalPackages.includes(workspace.pkgName),
    );
    expect(
      resolveAffected({
        files: [`${ordinary.dir}/src/probe.ts`],
        globalPackages,
        graph: GRAPH,
        lintOnlyPatterns,
      }).mode,
    ).toBe('scoped');
  });
});
