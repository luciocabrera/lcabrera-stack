/*
 * The gate packs real directories with pnpm, so `publishConfig.exports` is
 * substituted exactly as at release, and one package differs from the other
 * only by a published export whose target was never built.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { EMPTY_ROSTER, packedPublint } from './packed-publint.mjs';

let root = '';

const writePackage = ({ dir, name, published }) => {
  mkdirSync(join(root, dir, 'dist'), { recursive: true });
  writeFileSync(join(root, dir, 'dist', 'index.mjs'), 'export {};\n');
  writeFileSync(
    join(root, dir, 'package.json'),
    `${JSON.stringify(
      {
        exports: { '.': './src/index.ts' },
        files: ['dist'],
        name,
        publishConfig: { exports: { '.': published } },
        type: 'module',
        version: '0.0.0',
      },
      undefined,
      2,
    )}\n`,
  );
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'packed-publint-test-'));
  mkdirSync(join(root, 'out'));
});

afterEach(() => {
  rmSync(root, { force: true, recursive: true });
});

describe('packedPublint', () => {
  it('fails a published export whose dist target the tarball does not hold, and prints a line per package', async () => {
    writePackage({
      dir: 'packages/built',
      name: 'built',
      published: './dist/index.mjs',
    });
    writePackage({
      dir: 'packages/broken',
      name: 'broken',
      published: './dist/missing.mjs',
    });

    const { findings, lines } = await packedPublint({
      dirs: ['packages/broken', 'packages/built'],
      into: join(root, 'out'),
      repoRoot: root,
    });

    expect(lines).toEqual([
      'publint broken: 1 error(s)\n',
      'publint built: no errors\n',
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatch(/^broken: publint FILE_DOES_NOT_EXIST: /u);
    expect(findings[0]).toContain('./dist/missing.mjs');
  }, 60_000);

  it('passes when every published export resolves in its tarball', async () => {
    writePackage({
      dir: 'packages/built',
      name: 'built',
      published: './dist/index.mjs',
    });

    const result = await packedPublint({
      dirs: ['packages/built'],
      into: join(root, 'out'),
      repoRoot: root,
    });

    expect(result).toEqual({
      findings: [],
      lines: ['publint built: no errors\n'],
    });
  }, 60_000);

  it('refuses an empty roster rather than passing over nothing', async () => {
    expect(
      await packedPublint({
        dirs: [],
        into: join(root, 'out'),
        repoRoot: root,
      }),
    ).toEqual({ findings: [EMPTY_ROSTER], lines: [] });
  });
});
