import { describe, expect, it } from 'vite-plus/test';

import { DEFAULT_TREE_GATES, resolveTreeGates } from './config-tree-gates.mjs';
import { KINDS } from './conformance-artifacts.cjs';

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

  it('defaults the root suites to test:scripts over the code under scripts/', () => {
    expect(resolveTreeGates({}).affectedTests.rootSuites).toEqual([
      {
        patterns: [String.raw`^scripts/.+\.(mjs|cjs|js)$`],
        task: 'test:scripts',
      },
    ]);
  });

  it('reads root suites as given, and an empty list as none', () => {
    const suites = [
      { patterns: ['^evals/'], task: 'test:evals' },
      {
        patterns: ['^scripts/', String.raw`^\.fallowrc\.json$`],
        task: 'test:scripts',
      },
    ];
    expect(
      resolveTreeGates({ affectedTests: { rootSuites: suites } }).affectedTests
        .rootSuites,
    ).toEqual(suites);
    expect(
      resolveTreeGates({ affectedTests: { rootSuites: [] } }).affectedTests
        .rootSuites,
    ).toEqual([]);
  });

  it('refuses a root suite with no task, no patterns or a broken pattern', () => {
    for (const entry of [
      { patterns: ['^evals/'] },
      { patterns: [], task: 'test:evals' },
      { task: 'test:evals' },
      'test:evals',
    ]) {
      expect(() =>
        resolveTreeGates({ affectedTests: { rootSuites: [entry] } }),
      ).toThrow(/gates\.affectedTests\.rootSuites/u);
    }
    expect(() =>
      resolveTreeGates({
        affectedTests: {
          rootSuites: [{ patterns: ['('], task: 'test:evals' }],
        },
      }),
    ).toThrow(/do not compile/u);
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

  it('leaves the root eslint pass unprobed when the key is absent or blank', () => {
    for (const eslintPass of [{}, { rootPassDir: '' }, { rootPassDir: '  ' }]) {
      expect(resolveTreeGates({ eslintPass }).eslintPass.rootPassDir).toBe('');
    }
    expect(
      resolveTreeGates({ eslintPass: { rootPassDir: 'tools/' } }).eslintPass
        .rootPassDir,
    ).toBe('tools');
  });

  it('refuses a root pass directory that is not a string or leaves the repository', () => {
    for (const rootPassDir of [3, null, false, '../elsewhere', '/abs']) {
      expect(() => resolveTreeGates({ eslintPass: { rootPassDir } })).toThrow(
        /gates\.eslintPass\.rootPassDir/u,
      );
    }
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

  it('reads added harness roots, and adds none by default', () => {
    expect(resolveTreeGates({}).harness.additionalRoots).toEqual([]);
    expect(
      resolveTreeGates({
        harness: {
          additionalRoots: [
            { dir: 'vendor/skills/', kind: 'skill' },
            { dir: 'vendor/rules', kind: 'rule' },
          ],
        },
      }).harness.additionalRoots,
    ).toEqual([
      { dir: 'vendor/skills', kind: 'skill' },
      { dir: 'vendor/rules', kind: 'rule' },
    ]);
  });

  it('accepts a harness root of every kind conformance checks', () => {
    const roots = Object.keys(KINDS).map((kind) => ({ dir: kind, kind }));
    expect(
      resolveTreeGates({ harness: { additionalRoots: roots } }).harness
        .additionalRoots,
    ).toEqual(roots);
  });

  it('refuses a harness root with an unknown kind, no dir, or an escaping dir', () => {
    for (const entry of [
      { dir: 'vendor/skills', kind: 'skills' },
      { kind: 'skill' },
      'vendor/skills',
    ]) {
      expect(() =>
        resolveTreeGates({ harness: { additionalRoots: [entry] } }),
      ).toThrow(/gates\.harness\.additionalRoots/u);
    }
    expect(() =>
      resolveTreeGates({
        harness: { additionalRoots: [{ dir: '../x', kind: 'rule' }] },
      }),
    ).toThrow(/gates\.harness\.additionalRoots\[\]\.dir/u);
  });

  it('ignores a non-object where a block belongs rather than crashing', () => {
    expect(resolveTreeGates({ coverage: 'nope', usageReport: 4 })).toEqual(
      DEFAULT_TREE_GATES,
    );
  });
});
