/*
 * What a packed tarball may and may not carry, split out of
 * `devkit-tarball.test.mjs` at the script-size ceiling.
 *
 * The distinction these hold is the one a reader gets wrong: the same file name
 * is stray at the package root and correct inside the payload, because the
 * payload is what the package exists to hand on.
 */

import { describe, expect, it } from 'vite-plus/test';

import { strayFromTarball } from './devkit-tarball.mjs';

describe('strayFromTarball', () => {
  it('splits the payload: a config or a test travels, a generated tsconfig never does', () => {
    expect(
      strayFromTarball([
        'assets/workspace/vite.config.ts',
        'assets/workspace/roster.test.ts',
        'assets/workspace/tsconfig.app.json',
        'vite.config.ts',
      ]),
    ).toEqual(['assets/workspace/tsconfig.app.json', 'vite.config.ts']);
  });

  it('lets the payload carry the project file the generator never writes', () => {
    expect(
      strayFromTarball([
        'assets/workspace/apps/web/tsconfig.json',
        'assets/workspace/apps/web/tsconfig.node.json',
      ]),
    ).toEqual(['assets/workspace/apps/web/tsconfig.node.json']);
  });

  it('reports what no consumer should receive', () => {
    expect(
      strayFromTarball([
        'scripts/kit.mjs',
        'scripts/kit.test.mjs',
        'tsconfig.json',
        'tsconfig.app.json',
        'vite.config.ts',
        'eslint.config.mjs',
        'README.md',
      ]).toSorted((left, right) => left.localeCompare(right)),
    ).toEqual([
      'eslint.config.mjs',
      'scripts/kit.test.mjs',
      'tsconfig.app.json',
      'tsconfig.json',
      'vite.config.ts',
    ]);
  });

  it('does not mistake a source file for a test', () => {
    expect(
      strayFromTarball(['scripts/latest.mjs', 'scripts/contest.mjs']),
    ).toEqual([]);
  });
});
