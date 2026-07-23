import { describe, expect, it } from 'vite-plus/test';

import { resolveAffected } from './affected-tests.mjs';

// The selector is safety-critical: a wrong answer skips a test that a diff
// actually affected, and the job stays green while shipping the break. These are
// its first tests, added with the lint-only carve-out (#353) — a change touching
// only eslint/oxlint/oxfmt config must select nothing, since the linters gate
// those on every PR and lint config cannot change how a test builds or runs. The
// graph is synthetic so the cases are readable and there is no filesystem I/O:
// vite-configs is a GLOBAL package everything depends on, and the dependent chain
// is utils -> ui -> react-router.
const GRAPH = [
  {
    name: 'vite-configs',
    kind: 'pkg',
    dir: 'packages/vite-configs',
    pkgName: '@repo/vite-configs',
    deps: new Set(),
  },
  {
    name: 'utils',
    kind: 'pkg',
    dir: 'packages/utils',
    pkgName: '@lcabrera/utils',
    deps: new Set(['@repo/vite-configs']),
  },
  {
    name: 'ui',
    kind: 'pkg',
    dir: 'packages/ui',
    pkgName: '@lcabrera/ui',
    deps: new Set(['@repo/vite-configs', '@lcabrera/utils']),
  },
  {
    name: 'react-router',
    kind: 'app',
    dir: 'apps/react-router',
    pkgName: 'vite-react-compiler',
    deps: new Set(['@repo/vite-configs', '@lcabrera/ui']),
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
    // utils changed -> its dependents ui + react-router; vite-configs is NOT
    // pulled in, because its only changed file was filtered out.
    expect(new Set(result.packages)).toEqual(
      new Set(['@lcabrera/utils', '@lcabrera/ui', 'vite-react-compiler']),
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
      new Set(['@lcabrera/utils', '@lcabrera/ui', 'vite-react-compiler']),
    );
  });

  it('selects nothing for an empty diff', () => {
    expect(affected([]).mode).toBe('none');
  });
});
