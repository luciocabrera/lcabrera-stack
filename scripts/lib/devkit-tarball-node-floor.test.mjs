/*
 * The packed manifest's Node floor, split from `devkit-tarball.test.mjs` for
 * size — the ceiling in `.claude/rules/scripts.md` counts test files too.
 */
import { describe, expect, it } from 'vite-plus/test';

import { binsWithoutNodeFloor } from './devkit-tarball.mjs';

const MANIFEST = {
  bin: { 'kit-doctor': './scripts/doctor.mjs', kit: './scripts/kit.mjs' },
  exports: {
    './config': './scripts/config.mjs',
    './package.json': './package.json',
  },
  name: '@scope/kit',
};

describe('binsWithoutNodeFloor', () => {
  it('reports a packed manifest that declares bins and no engines.node', () => {
    expect(binsWithoutNodeFloor(MANIFEST)).toEqual([
      '@scope/kit declares 2 bin(s) and no `engines.node` in the packed manifest, so nothing holds a consumer to the Node they were written for',
    ]);
  });

  it('is satisfied by a floor', () => {
    expect(
      binsWithoutNodeFloor({ ...MANIFEST, engines: { node: '>=26' } }),
    ).toEqual([]);
  });

  it('does not ask a package that ships no bin', () => {
    expect(
      binsWithoutNodeFloor({ exports: MANIFEST.exports, name: '@scope/lib' }),
    ).toEqual([]);
  });

  it('is not satisfied by an engines block that names something else', () => {
    expect(
      binsWithoutNodeFloor({ ...MANIFEST, engines: { pnpm: '>=11' } }),
    ).toHaveLength(1);
  });
});
