import { describe, expect, it } from 'vite-plus/test';

import { resolveAffected, resolveTestGroups } from './affected-tests.mjs';

const GRAPH = [
  {
    name: 'vite-configs',
    kind: 'pkg',
    dir: 'packages/vite-configs',
    pkgName: '@lcabrera/vite-config',
    deps: new Set(),
  },
  {
    name: 'utils',
    kind: 'pkg',
    dir: 'packages/utils',
    pkgName: '@lcabrera/utils',
    deps: new Set(['@lcabrera/vite-config']),
  },
  {
    name: 'ui',
    kind: 'pkg',
    dir: 'packages/ui',
    pkgName: '@lcabrera/ui',
    deps: new Set(['@lcabrera/vite-config', '@lcabrera/utils']),
  },
  {
    name: 'showcase',
    kind: 'app',
    dir: 'apps/showcase',
    pkgName: 'showcase',
    deps: new Set(['@lcabrera/vite-config', '@lcabrera/ui']),
  },
];

const affected = (files) => resolveAffected({ files, graph: GRAPH });

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
    expect(result.mode).toBe('scoped');
    expect(new Set(result.packages)).toEqual(
      new Set(['@lcabrera/utils', '@lcabrera/ui', 'showcase']),
    );
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
    const result = affected(['packages/utils/src/foo.ts']);
    expect(result.mode).toBe('scoped');
    expect(new Set(result.packages)).toEqual(
      new Set(['@lcabrera/utils', '@lcabrera/ui', 'showcase']),
    );
  });

  it('selects nothing for an empty diff', () => {
    expect(affected([]).mode).toBe('none');
  });
});

describe('resolveTestGroups — scripts/ runs the root test:scripts suite', () => {
  const groupsFor = (files) => resolveTestGroups({ files, graph: GRAPH });
  const scriptsGroup = (groups) =>
    groups.find(
      (group) => group.task === 'test:scripts' && group.packages.length === 0,
    );

  it('adds only the root test:scripts group for a scripts-only change', () => {
    const result = groupsFor(['scripts/lib/foo.mjs']);
    expect(result.scripts).toBe(true);
    expect(result.mode).toBe('none');
    expect(result.groups).toHaveLength(1);
    expect(scriptsGroup(result.groups)).toBeDefined();
  });

  it('runs test:scripts alongside an affected workspace', () => {
    const { groups } = groupsFor([
      'scripts/lib/foo.mjs',
      'packages/utils/src/foo.ts',
    ]);
    expect(scriptsGroup(groups)).toBeDefined();
    expect(
      groups.some(
        (group) => group.task === 'test' && group.packages.length > 0,
      ),
    ).toBe(true);
  });

  it('detects a scripts test file, not just a source script', () => {
    expect(
      resolveAffected({ files: ['scripts/lib/foo.test.mjs'], graph: GRAPH })
        .scripts,
    ).toBe(true);
  });

  it('adds no test:scripts group when scripts/ is untouched', () => {
    expect(scriptsGroup(groupsFor(['packages/utils/src/foo.ts']).groups)).toBe(
      undefined,
    );
  });

  it('ignores a non-code file under scripts/ (docs, JSON data)', () => {
    expect(
      resolveAffected({ files: ['scripts/README.md'], graph: GRAPH }).scripts,
    ).toBe(false);
    expect(
      resolveAffected({
        files: ['scripts/script-size-baseline.json'],
        graph: GRAPH,
      }).scripts,
    ).toBe(false);
  });
});
