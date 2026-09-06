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

  it('keeps a workspace entry only when it names a directory and a package', () => {
    const gates = resolveTreeGates({
      coverage: {
        reportWorkspaces: [
          { dir: 'packages/one', name: '@scope/one', run: true },
          { dir: 'packages/two', name: '@scope/two' },
          { dir: '', name: '@scope/three' },
          { name: '@scope/four' },
          'packages/five',
        ],
      },
    });
    expect(gates.coverage.reportWorkspaces).toEqual([
      { dir: 'packages/one', name: '@scope/one', run: true },
      { dir: 'packages/two', name: '@scope/two' },
    ]);
  });

  it('keeps a tree entry only when it names an inventory and a root', () => {
    const gates = resolveTreeGates({
      inventory: {
        trees: [
          {
            inventory: 'packages/one/src/INVENTORY.md',
            root: 'packages/one/src',
          },
          { inventory: 'packages/two/src/INVENTORY.md' },
          { root: 'packages/three/src' },
        ],
      },
    });
    expect(gates.inventory.trees).toEqual([
      { inventory: 'packages/one/src/INVENTORY.md', root: 'packages/one/src' },
    ]);
  });

  it('drops a probe workspace that is not a non-empty string', () => {
    const gates = resolveTreeGates({
      eslintPass: { probeWorkspaces: ['packages/one', '', 3, null] },
    });
    expect(gates.eslintPass.probeWorkspaces).toEqual(['packages/one']);
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
