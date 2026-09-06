import { describe, expect, it } from 'vite-plus/test';

import { DEFAULT_TREE_GATES, resolveTreeGates } from './config-tree-gates.mjs';

describe('resolveTreeGates', () => {
  it('an empty gates block is the documented default', () => {
    expect(resolveTreeGates({})).toEqual(DEFAULT_TREE_GATES);
  });

  it('defaults every workspace roster to nothing', () => {
    const gates = resolveTreeGates({});
    expect(gates.coverage.mergeWorkspaces).toEqual([]);
    expect(gates.coverage.reportWorkspaces).toEqual([]);
    expect(gates.eslintPass.probeWorkspaces).toEqual([]);
    expect(gates.inventory.trees).toEqual([]);
    expect(gates.affectedTests.coverageTaskPackage).toBe('');
  });

  it('overrides only the keys it names', () => {
    const gates = resolveTreeGates({
      departedNames: { rosterFile: 'config/departed.json' },
    });
    expect(gates.departedNames.rosterFile).toBe('config/departed.json');
    expect(gates.depsAudit).toEqual(DEFAULT_TREE_GATES.depsAudit);
  });

  it('reads a workspace entry that names a directory and a package', () => {
    const gates = resolveTreeGates({
      coverage: {
        reportWorkspaces: [
          { dir: 'packages/one', name: '@scope/one', run: true },
          { dir: 'packages/two', name: '@scope/two' },
        ],
      },
    });
    expect(gates.coverage.reportWorkspaces).toEqual([
      { dir: 'packages/one', name: '@scope/one', run: true },
      { dir: 'packages/two', name: '@scope/two' },
    ]);
  });

  it('refuses a workspace entry missing a name or a dir, rather than shrinking the roster', () => {
    for (const entry of [
      { dir: '', name: '@scope/three' },
      { name: '@scope/four' },
      'packages/five',
    ]) {
      expect(() =>
        resolveTreeGates({
          coverage: {
            reportWorkspaces: [
              { dir: 'packages/one', name: '@scope/one' },
              entry,
            ],
          },
        }),
      ).toThrow(/gates\.coverage\.reportWorkspaces/u);
    }
  });

  it('reads a tree entry that names an inventory and a root', () => {
    const gates = resolveTreeGates({
      inventory: {
        trees: [
          {
            inventory: 'packages/one/src/INVENTORY.md',
            root: 'packages/one/src',
          },
        ],
      },
    });
    expect(gates.inventory.trees).toEqual([
      { inventory: 'packages/one/src/INVENTORY.md', root: 'packages/one/src' },
    ]);
  });

  it('refuses a tree entry missing an inventory or a root', () => {
    for (const entry of [
      { inventory: 'packages/two/src/INVENTORY.md' },
      { root: 'packages/three/src' },
    ]) {
      expect(() => resolveTreeGates({ inventory: { trees: [entry] } })).toThrow(
        /gates\.inventory\.trees/u,
      );
    }
  });

  it('refuses a probe workspace that is not a non-empty string', () => {
    for (const entry of ['', 3, null]) {
      expect(() =>
        resolveTreeGates({
          eslintPass: { probeWorkspaces: ['packages/one', entry] },
        }),
      ).toThrow(/gates\.eslintPass\.probeWorkspaces/u);
    }
    expect(
      resolveTreeGates({ eslintPass: { probeWorkspaces: ['packages/one'] } })
        .eslintPass.probeWorkspaces,
    ).toEqual(['packages/one']);
  });

  it('refuses a path that leaves the repository, naming the key', () => {
    expect(() =>
      resolveTreeGates({ reactDoctor: { reportFile: '../elsewhere.json' } }),
    ).toThrow(/gates\.reactDoctor\.reportFile/);
    expect(() =>
      resolveTreeGates({
        inventory: { trees: [{ inventory: '/etc/x', root: 'a' }] },
      }),
    ).toThrow(/gates\.inventory\.trees\[\]\.inventory/);
  });

  it('ignores a non-object where a block belongs rather than crashing', () => {
    expect(resolveTreeGates({ coverage: 'nope', usageReport: 4 })).toEqual(
      DEFAULT_TREE_GATES,
    );
  });
});
