import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';
import { parseAllDocuments } from 'yaml';

const require = createRequire(import.meta.url);
const {
  catalogTypeScript,
  needsTypeScript6,
  pinTypeScript6,
  rangeAdmits,
  workspaceGlobs,
} = require('./lib/eslint-typescript.cjs');

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const read = (file) => readFileSync(join(REPO_ROOT, file), 'utf8');

const context = {
  catalogVersion: '7.0.2',
  workspaceNames: new Set(['@scope/workspace']),
};

const baseName = (key) => {
  const match = /^('?)(@?[^@(]+)@([^(]+)/.exec(key);
  return match === null ? key : `${match[2]}@${match[3]}`;
};

const nameOf = (key) => baseName(key).replace(/@[^@]+$/, '');

const resolvedVersion = (value) => /^(\d[^(]*)/.exec(value)?.[1];

const loadLockfile = () => {
  const lockfile = parseAllDocuments(read('pnpm-lock.yaml'))
    .map((document) => document.toJS())
    .findLast((document) => document?.snapshots !== undefined);
  return {
    packages: lockfile.packages ?? {},
    snapshots: Object.entries(lockfile.snapshots ?? {}).map(
      ([key, snapshot]) => ({
        dependencies: {
          ...snapshot?.dependencies,
          ...snapshot?.optionalDependencies,
        },
        key,
        name: nameOf(key),
        packageKey: baseName(key),
      }),
    ),
  };
};

const reachableFrom = (roots, snapshots) => {
  const byKey = new Map(snapshots.map((snapshot) => [snapshot.key, snapshot]));
  const seen = new Set();
  const queue = [...roots];
  while (queue.length > 0) {
    const current = queue.pop();
    if (!seen.has(current.key)) {
      seen.add(current.key);
      const next = Object.entries(current.dependencies)
        .filter(([name]) => name !== 'typescript')
        .map(
          ([name, value]) =>
            byKey.get(`${name}@${value}`) ?? byKey.get(String(value)),
        )
        .filter((snapshot) => snapshot !== undefined);
      queue.push(...next);
    }
  }
  return snapshots.filter((snapshot) => seen.has(snapshot.key));
};

describe('rangeAdmits', () => {
  it.each([
    ['>=4.8.4 <6.1.0', false],
    ['^5.0.0 || ^6.0.0', false],
    ['6.x', false],
    ['1.0.0 - 6.9.9', false],
    ['*', true],
    ['>=4.8.4', true],
    ['^5.1.0 || ^6.0.0 || ^7.0.0', true],
    ['~7.0.0', true],
    ['not a range', true],
  ])('reads %s against 7.0.2 as %s', (range, admits) => {
    expect(rangeAdmits(range, '7.0.2')).toBe(admits);
  });
});

describe('needsTypeScript6', () => {
  it('pins a package that runs inside ESLint, whatever its typescript peer says', () => {
    expect(
      needsTypeScript6(
        { name: 'plugin', peerDependencies: { eslint: '*', typescript: '*' } },
        context,
      ),
    ).toBe(true);
    expect(
      needsTypeScript6(
        { name: 'plugin', peerDependencies: { eslint: '*' } },
        context,
      ),
    ).toBe(true);
  });

  it('pins a package whose typescript peer excludes the catalog version', () => {
    expect(
      needsTypeScript6(
        { name: 'parser', peerDependencies: { typescript: '>=4.8.4 <6.1.0' } },
        context,
      ),
    ).toBe(true);
  });

  it('leaves a package whose typescript peer admits the catalog version', () => {
    expect(
      needsTypeScript6(
        {
          name: 'bundler',
          peerDependencies: { typescript: '^6.0.0 || ^7.0.0' },
        },
        context,
      ),
    ).toBe(false);
  });

  it('leaves a workspace project, which declares its own typescript', () => {
    expect(
      needsTypeScript6(
        { name: '@scope/workspace', peerDependencies: { eslint: '*' } },
        context,
      ),
    ).toBe(false);
  });
});

describe('pinTypeScript6', () => {
  it('moves the typescript peer to a dependency and keeps every other entry', () => {
    expect(
      pinTypeScript6(
        {
          dependencies: { a: '1' },
          name: 'plugin',
          peerDependencies: { eslint: '*', typescript: '*' },
          peerDependenciesMeta: { typescript: { optional: true } },
        },
        'npm:typescript@^6.0.3',
      ),
    ).toStrictEqual({
      dependencies: { a: '1', typescript: 'npm:typescript@^6.0.3' },
      name: 'plugin',
      peerDependencies: { eslint: '*' },
      peerDependenciesMeta: {},
    });
  });
});

describe('the workspace manifest the hook reads', () => {
  it('names the build catalog typescript and the workspace globs', () => {
    const yaml = read('pnpm-workspace.yaml');
    expect(catalogTypeScript(yaml)).toMatch(/^\d+\.\d+\.\d+$/);
    expect(workspaceGlobs(yaml)).toContain('packages/*');
  });
});

describe('the installed lockfile', () => {
  const { packages, snapshots } = loadLockfile();

  it('resolves one vite-plus instance', () => {
    expect(
      snapshots.filter((snapshot) => snapshot.name === 'vite-plus'),
    ).toHaveLength(1);
  });

  it('gives TypeScript 6 to every package ESLint loads', () => {
    const roots = snapshots.filter(
      (snapshot) => packages[snapshot.packageKey]?.peerDependencies?.eslint,
    );
    const offenders = reachableFrom(roots, snapshots)
      .filter((snapshot) => snapshot.dependencies.typescript !== undefined)
      .filter(
        (snapshot) =>
          !resolvedVersion(
            String(snapshot.dependencies.typescript),
          )?.startsWith('6.'),
      )
      .map((snapshot) => snapshot.key);
    expect(roots.length).toBeGreaterThan(0);
    expect(offenders).toStrictEqual([]);
  });

  it('resolves every typescript peer inside the range it declares', () => {
    const offenders = snapshots
      .filter((snapshot) => snapshot.dependencies.typescript !== undefined)
      .filter((snapshot) => {
        const range =
          packages[snapshot.packageKey]?.peerDependencies?.typescript;
        const version = resolvedVersion(
          String(snapshot.dependencies.typescript),
        );
        return (
          range !== undefined &&
          version !== undefined &&
          !rangeAdmits(range, version)
        );
      })
      .map((snapshot) => snapshot.key);
    expect(offenders).toStrictEqual([]);
  });
});
