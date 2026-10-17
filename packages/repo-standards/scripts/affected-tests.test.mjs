import { describe, expect, it } from 'vite-plus/test';

import { resolveAffected, resolveTestGroups } from './affected-tests.mjs';
import { DEFAULT_TREE_GATES } from './config-tree-gates.mjs';

const GRAPH = [
  {
    deps: new Set(),
    dir: 'packages/vite-configs',
    kind: 'pkg',
    name: 'vite-configs',
    pkgName: '@lcabrera/vite-config',
  },
  {
    deps: new Set(['@lcabrera/vite-config']),
    dir: 'packages/utils',
    kind: 'pkg',
    name: 'utils',
    pkgName: '@lcabrera/utils',
  },
  {
    deps: new Set(['@lcabrera/utils', '@lcabrera/vite-config']),
    dir: 'packages/ui',
    kind: 'pkg',
    name: 'ui',
    pkgName: '@lcabrera/ui',
  },
  {
    deps: new Set(['@lcabrera/ui', '@lcabrera/vite-config']),
    dir: 'apps/showcase',
    kind: 'app',
    name: 'showcase',
    pkgName: 'showcase',
  },
];

const FIXTURE_GLOBAL_PACKAGES = ['@lcabrera/vite-config'];

const FIXTURE_LINT_ONLY_PATTERNS = [
  String.raw`^packages/vite-configs/eslint\.`,
  String.raw`^packages/vite-configs/vite\.(lint|fmt)\.shared\.config\.ts$`,
  String.raw`(^|/)eslint\.config\.mjs$`,
];

const affected = (files) =>
  resolveAffected({
    files,
    globalPackages: FIXTURE_GLOBAL_PACKAGES,
    graph: GRAPH,
    lintOnlyPatterns: FIXTURE_LINT_ONLY_PATTERNS,
  });

const expectScopedToUtilsAndDependents = (result) => {
  expect(result.mode).toBe('scoped');
  expect(new Set(result.packages)).toEqual(
    new Set(['@lcabrera/ui', '@lcabrera/utils', 'showcase']),
  );
};

describe('resolveAffected — lint-only carve-out', () => {
  it('selects nothing for an eslint-factory-only change in vite-configs', () => {
    const result = affected([
      'packages/vite-configs/eslint.restrictions.shared.mjs',
    ]);
    expect(result.mode).toBe('none');
    expect(result.packages).toEqual([]);
  });

  it('selects nothing for the Oxlint/Oxfmt config factories', () => {
    expect(
      affected(['packages/vite-configs/vite.lint.shared.config.ts']).mode,
    ).toBe('none');
    expect(
      affected(['packages/vite-configs/vite.fmt.shared.config.ts']).mode,
    ).toBe('none');
  });

  it("selects nothing for a workspace's own eslint.config.mjs", () => {
    expect(affected(['packages/ui/eslint.config.mjs']).mode).toBe('none');
  });

  it('ignores a lint-only file mixed with a real source edit', () => {
    const result = affected([
      'packages/vite-configs/eslint.custom-rules.shared.config.mjs',
      'packages/utils/src/foo.ts',
    ]);
    expectScopedToUtilsAndDependents(result);
  });
});

describe('resolveAffected — still forces full where it must', () => {
  it('forces a full run for a vite build/test factory in vite-configs', () => {
    const result = affected([
      'packages/vite-configs/vite.run.shared.config.ts',
    ]);
    expect(result.mode).toBe('full');
    expect(new Set(result.packages)).toEqual(
      new Set(GRAPH.map((workspace) => workspace.pkgName)),
    );
  });

  it('forces a full run for the lockfile even alongside a lint-only file', () => {
    const result = affected([
      'packages/vite-configs/eslint.restrictions.shared.mjs',
      'pnpm-lock.yaml',
    ]);
    expect(result.mode).toBe('full');
  });
});

describe('resolveAffected — ordinary scoping is unchanged', () => {
  it('scopes a workspace change to that workspace and its dependents', () => {
    expectScopedToUtilsAndDependents(affected(['packages/utils/src/foo.ts']));
  });

  it('selects nothing for an empty diff', () => {
    expect(affected([]).mode).toBe('none');
  });
});
const DEFAULT_ROOT_SUITES = DEFAULT_TREE_GATES.affectedTests.rootSuites;

const FIXTURE_ROOT_SUITES = [
  {
    patterns: ['^scripts/', String.raw`^\.fallowrc\.json$`],
    task: 'test:scripts',
  },
  { patterns: ['^evals/'], task: 'test:evals' },
];

const suiteGroup = (groups, task) =>
  groups.find((group) => group.task === task && group.packages.length === 0);

const groupsFor = (files, rootSuites = DEFAULT_ROOT_SUITES) =>
  resolveTestGroups({
    files,
    globalPackages: FIXTURE_GLOBAL_PACKAGES,
    graph: GRAPH,
    lintOnlyPatterns: FIXTURE_LINT_ONLY_PATTERNS,
    rootSuites,
  });

const suitesFor = (files, rootSuites = DEFAULT_ROOT_SUITES) =>
  resolveAffected({
    files,
    globalPackages: FIXTURE_GLOBAL_PACKAGES,
    graph: GRAPH,
    lintOnlyPatterns: FIXTURE_LINT_ONLY_PATTERNS,
    rootSuites,
  }).suites;

describe('resolveTestGroups — the default root suite is test:scripts', () => {
  it('adds only the root test:scripts group for a scripts-only change', () => {
    const result = groupsFor(['scripts/lib/foo.mjs']);
    expect(result.suites).toEqual(['test:scripts']);
    expect(result.mode).toBe('none');
    expect(result.groups).toHaveLength(1);
    expect(suiteGroup(result.groups, 'test:scripts')).toBeDefined();
  });

  it('runs test:scripts alongside an affected workspace', () => {
    const { groups } = groupsFor([
      'scripts/lib/foo.mjs',
      'packages/utils/src/foo.ts',
    ]);
    expect(suiteGroup(groups, 'test:scripts')).toBeDefined();
    expect(
      groups.some(
        (group) => group.task === 'test' && group.packages.length > 0,
      ),
    ).toBe(true);
  });

  it('detects a scripts test file, not just a source script', () => {
    expect(suitesFor(['scripts/lib/foo.test.mjs'])).toEqual(['test:scripts']);
  });

  it('adds no root group when no suite input changed', () => {
    expect(
      suiteGroup(
        groupsFor(['packages/utils/src/foo.ts']).groups,
        'test:scripts',
      ),
    ).toBe(undefined);
  });

  it('ignores a non-code file under scripts/ (docs, JSON data)', () => {
    expect(suitesFor(['scripts/README.md'])).toEqual([]);
    expect(suitesFor(['scripts/script-size-baseline.json'])).toEqual([]);
  });
});

describe('resolveTestGroups — configured root suites', () => {
  it('selects a suite for a file outside its directory that it reads', () => {
    const result = groupsFor(['.fallowrc.json'], FIXTURE_ROOT_SUITES);
    expect(result.mode).toBe('none');
    expect(result.groups).toEqual([{ packages: [], task: 'test:scripts' }]);
  });

  it('selects a second suite by its own patterns, and only that one', () => {
    const result = groupsFor(['evals/run-record.mjs'], FIXTURE_ROOT_SUITES);
    expect(result.groups).toEqual([{ packages: [], task: 'test:evals' }]);
  });

  it('selects every suite whose inputs changed, after the workspace groups', () => {
    const { groups } = groupsFor(
      ['evals/a.mjs', '.fallowrc.json', 'packages/utils/src/foo.ts'],
      FIXTURE_ROOT_SUITES,
    );
    expect(groups.map((group) => group.task)).toEqual([
      'test',
      'test:scripts',
      'test:evals',
    ]);
  });

  it('selects no suite for a file none of them reads', () => {
    expect(suitesFor(['docs/notes.md'], FIXTURE_ROOT_SUITES)).toEqual([]);
  });

  it('selects no suite when none is configured', () => {
    expect(suitesFor(['scripts/lib/foo.mjs', 'evals/a.mjs'], [])).toEqual([]);
    expect(
      resolveAffected({
        files: ['scripts/lib/foo.mjs'],
        globalPackages: FIXTURE_GLOBAL_PACKAGES,
        graph: GRAPH,
      }).suites,
    ).toEqual([]);
  });

  it('drops a lint-only file before matching it against a suite', () => {
    expect(
      suitesFor(
        ['eslint.config.mjs'],
        [{ patterns: ['^[^/]+$'], task: 'test:scripts' }],
      ),
    ).toEqual([]);
  });
});

describe('resolveAffected — the rosters are the caller’s to supply', () => {
  it('refuses a run with no global packages rather than scoping it', () => {
    expect(() =>
      resolveAffected({
        files: ['packages/vite-configs/vite.run.shared.config.ts'],
        globalPackages: [],
        graph: GRAPH,
        lintOnlyPatterns: FIXTURE_LINT_ONLY_PATTERNS,
      }),
    ).toThrow(/globalPackages/u);
  });

  it('refuses a run that never mentions them at all', () => {
    expect(() => resolveAffected({ files: [], graph: GRAPH })).toThrow(
      /globalPackages/u,
    );
  });

  it('forces the full run only for the packages it was handed', () => {
    expect(
      resolveAffected({
        files: ['packages/utils/src/foo.ts'],
        globalPackages: ['@lcabrera/utils'],
        graph: GRAPH,
        lintOnlyPatterns: [],
      }).mode,
    ).toBe('full');
    expect(affected(['packages/utils/src/foo.ts']).mode).toBe('scoped');
  });

  it('selects a lint-only file when no pattern drops it, never the reverse', () => {
    expect(
      resolveAffected({
        files: ['packages/ui/eslint.config.mjs'],
        globalPackages: FIXTURE_GLOBAL_PACKAGES,
        graph: GRAPH,
        lintOnlyPatterns: [],
      }).mode,
    ).toBe('scoped');
    expect(affected(['packages/ui/eslint.config.mjs']).mode).toBe('none');
  });
});
