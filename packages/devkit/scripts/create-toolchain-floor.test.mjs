/*
 * A repository created by this kit must not resolve a kit older than the one
 * that created it, so the floor `create` writes for the kit is read from the
 * kit's own manifest rather than written by hand (#1219). Swapping the
 * manifest's version under the module is what a hand-written floor would fail.
 */
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

const MANIFEST = '../package.json';

const createWithVersion = async (version) => {
  vi.resetModules();
  vi.doMock(MANIFEST, () => ({ default: { version } }));
  return import('./create.mjs');
};

afterEach(() => {
  vi.doUnmock(MANIFEST);
  vi.resetModules();
});

describe('the floor a created repository declares for this kit', () => {
  test.each([
    ['0.6.0', '>=0.6.0 <1.0.0'],
    ['0.41.7', '>=0.41.7 <1.0.0'],
    ['1.2.3', '>=1.2.3 <2.0.0'],
  ])('a kit at %s writes %s', async (version, range) => {
    const { DEVKIT_PACKAGE, initialManifest, TOOLCHAIN_RANGES } =
      await createWithVersion(version);

    expect(TOOLCHAIN_RANGES[DEVKIT_PACKAGE]).toBe(range);
    expect(
      initialManifest({ name: 'demo' }).devDependencies[DEVKIT_PACKAGE],
    ).toBe(range);
  });
});
