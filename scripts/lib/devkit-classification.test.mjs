import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { createFixtureRoots } from '../../packages/repo-standards/scripts/repo-fixtures.mjs';

import {
  assetMatcher,
  assetPatternsIn,
  coverageReport,
} from './devkit-classification.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const VERIFIER = join(REPO_ROOT, 'scripts', 'verify-devkit-classification.mjs');

const TABLE = [
  'Prose naming `skills/prose-only/**` outside any table.',
  '',
  '| Asset | Verdict | Reason |',
  '| ----- | ------- | ------ |',
  '| `name-only` → `skills/name-only/**` | **portable** | — |',
  '| `workspace/a.json`, `workspace/apps/*` | **portable** | — |',
  '| `name-without-path` | **repo-specific** | Mentions `rules/in-reason.md`. |',
].join('\n');

describe('assetPatternsIn', () => {
  it('reads the slash tokens of every first cell and nothing else', () => {
    expect(assetPatternsIn(TABLE)).toEqual([
      'skills/name-only/**',
      'workspace/a.json',
      'workspace/apps/*',
    ]);
  });
});

describe('assetMatcher', () => {
  it('keeps a single star inside one directory', () => {
    const matches = assetMatcher('workspace/apps/*');
    expect(matches('workspace/apps/package.json')).toBe(true);
    expect(matches('workspace/apps/src/root.tsx')).toBe(false);
  });

  it('lets a double star span directories, dot-named ones included', () => {
    const matches = assetMatcher('full/apps/web/src/**');
    expect(matches('full/apps/web/src/routes/orders/.server/x.ts')).toBe(true);
    expect(matches('full/apps/web/package.json')).toBe(false);
  });

  it('matches a double star in the middle of a pattern at any depth', () => {
    const matches = assetMatcher('skills/**/SKILL.md');
    expect(matches('skills/SKILL.md')).toBe(true);
    expect(matches('skills/a/b/SKILL.md')).toBe(true);
    expect(matches('skills/a/b/OTHER.md')).toBe(false);
  });

  it('reads a dot in a literal path as a dot', () => {
    expect(
      assetMatcher('workspace/.node-version')('workspace/xnode-version'),
    ).toBe(false);
  });
});

describe('coverageReport', () => {
  it('reports a file no row names and a row path no file matches', () => {
    expect(
      coverageReport({
        assets: ['workspace/a.json', 'workspace/new.json'],
        patterns: ['workspace/a.json', 'workspace/gone/**'],
      }),
    ).toEqual({
      stale: ['workspace/gone/**'],
      uncovered: ['workspace/new.json'],
    });
  });
});

const { make, removeAll } = createFixtureRoots('devkit-classification-');

const DEVKIT = join(REPO_ROOT, 'packages', 'devkit');

const copyOfThisTree = () => {
  const root = make();
  const devkit = join(root, 'packages', 'devkit');
  cpSync(join(DEVKIT, 'assets'), join(devkit, 'assets'), { recursive: true });
  cpSync(join(DEVKIT, 'CLASSIFICATION.md'), join(devkit, 'CLASSIFICATION.md'));
  return root;
};

const plant = (root, assetPath) => {
  const path = join(root, 'packages', 'devkit', 'assets', assetPath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, '');
};

const run = (cwd) =>
  spawnSync(process.execPath, [VERIFIER], { cwd, encoding: 'utf8' });

describe('verify-devkit-classification against this tree', () => {
  afterEach(() => {
    removeAll();
  });

  it('passes on the committed assets and classification', () => {
    expect(run(copyOfThisTree()).status).toBe(0);
  });

  it.each([
    'workspace/planted.config.ts',
    'full/docker/planted.yml',
    'skills/planted/SKILL.md',
    'planted-group/file.md',
  ])('fails on a planted asset with no row: %s', (planted) => {
    const root = copyOfThisTree();
    plant(root, planted);
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`assets/${planted}  has no row`);
  });

  it('fails on a row whose only file no longer ships', () => {
    const root = copyOfThisTree();
    rmSync(
      join(root, 'packages', 'devkit', 'assets', 'workspace', 'gitignore'),
    );
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('`workspace/gitignore`  is a row path');
  });
});
