import { describe, expect, it } from 'vite-plus/test';

import {
  changedChangesetIds,
  missingChangesets,
  packageTouches,
  parseNameStatus,
} from './changeset-required.mjs';

const ALPHA = { dir: 'packages/alpha', name: '@s/alpha', version: '0.1.0' };

const MANIFESTS = {
  base: [ALPHA],
  head: [{ ...ALPHA, dir: 'packages/renamed' }],
};

describe('parseNameStatus', () => {
  it('reads single-path entries and rename pairs from -z output', () => {
    expect(
      parseNameStatus('M\0a.md\0R100\0old/x\0new/x\0R087\0p\0q\0D\0gone\0'),
    ).toEqual([
      { path: 'a.md', status: 'M' },
      { from: 'old/x', path: 'new/x', status: 'R', unchanged: true },
      { from: 'p', path: 'q', status: 'R', unchanged: false },
      { path: 'gone', status: 'D' },
    ]);
  });
});

describe('changedChangesetIds', () => {
  it('keeps added and edited changesets, never the README or a consumed one', () => {
    expect(
      changedChangesetIds([
        { path: '.changeset/one.md', status: 'A' },
        { path: '.changeset/two.md', status: 'M' },
        { path: '.changeset/consumed.md', status: 'D' },
        { path: '.changeset/README.md', status: 'M' },
        { path: '.changeset/config.json', status: 'M' },
      ]),
    ).toEqual(['one', 'two']);
  });
});

describe('packageTouches', () => {
  it('drops an unchanged file that moved with its package directory', () => {
    expect(
      packageTouches({
        changes: [
          {
            from: 'packages/alpha/src/a.mjs',
            path: 'packages/renamed/src/a.mjs',
            status: 'R',
            unchanged: true,
          },
        ],
        manifests: MANIFESTS,
      }),
    ).toEqual([]);
  });

  it('reads an edited rename as a removal at the base and an addition at the head', () => {
    expect(
      packageTouches({
        changes: [
          {
            from: 'packages/alpha/src/a.mjs',
            path: 'packages/renamed/src/a.mjs',
            status: 'R',
            unchanged: false,
          },
        ],
        manifests: MANIFESTS,
      }).map(({ path, side }) => `${side}:${path}`),
    ).toEqual([
      'base:packages/alpha/src/a.mjs',
      'head:packages/renamed/src/a.mjs',
    ]);
  });

  it('ignores a path outside every workspace', () => {
    expect(
      packageTouches({
        changes: [{ path: 'docs/a.md', status: 'M' }],
        manifests: MANIFESTS,
      }),
    ).toEqual([]);
  });
});

describe('missingChangesets', () => {
  const touchIn = (manifest, file) => ({
    dir: manifest.dir,
    name: manifest.name,
    path: `${manifest.dir}/${file}`,
    side: 'head',
  });
  const INTERNAL = {
    dir: 'apps/site',
    name: 'site',
    private: true,
    version: '0.0.0',
  };

  const recordingPack = (shipped) => {
    const calls = [];
    return {
      calls,
      pack: (target) => {
        calls.push(`${target.side}:${target.dir}`);
        return new Set(shipped);
      },
    };
  };

  const check = ({ manifests, namedPackages = new Set(), touches }) => {
    const recorder = recordingPack(['README.md', 'src/index.ts']);
    return {
      calls: recorder.calls,
      missing: missingChangesets({
        manifests,
        namedPackages,
        pack: recorder.pack,
        touches,
      }),
    };
  };

  it('names the package and its shipped file, packing it once', () => {
    expect(
      check({
        manifests: { base: [ALPHA], head: [ALPHA] },
        touches: [
          touchIn(ALPHA, 'README.md'),
          touchIn(ALPHA, 'src/index.ts'),
          touchIn(ALPHA, 'src/index.test.ts'),
        ],
      }),
    ).toEqual({
      calls: ['head:packages/alpha'],
      missing: [
        {
          files: ['packages/alpha/README.md', 'packages/alpha/src/index.ts'],
          name: '@s/alpha',
        },
      ],
    });
  });

  it('packs nothing for a private workspace', () => {
    expect(
      check({
        manifests: { base: [INTERNAL], head: [INTERNAL] },
        touches: [touchIn(INTERNAL, 'README.md')],
      }),
    ).toEqual({ calls: [], missing: [] });
  });

  it('packs nothing for a package a changeset in the change already names', () => {
    expect(
      check({
        manifests: { base: [ALPHA], head: [ALPHA] },
        namedPackages: new Set(['@s/alpha']),
        touches: [touchIn(ALPHA, 'README.md')],
      }),
    ).toEqual({ calls: [], missing: [] });
  });

  it('packs nothing for a package whose version the change moves', () => {
    expect(
      check({
        manifests: { base: [ALPHA], head: [{ ...ALPHA, version: '0.2.0' }] },
        touches: [touchIn(ALPHA, 'README.md')],
      }),
    ).toEqual({ calls: [], missing: [] });
  });

  it('packs nothing for a package absent or private at the base', () => {
    expect(
      check({
        manifests: { base: [], head: [ALPHA] },
        touches: [touchIn(ALPHA, 'README.md')],
      }),
    ).toEqual({ calls: [], missing: [] });
    expect(
      check({
        manifests: { base: [{ ...ALPHA, private: true }], head: [ALPHA] },
        touches: [touchIn(ALPHA, 'README.md')],
      }),
    ).toEqual({ calls: [], missing: [] });
  });

  it('packs nothing for a package the change makes private', () => {
    expect(
      check({
        manifests: { base: [ALPHA], head: [{ ...ALPHA, private: true }] },
        touches: [touchIn(ALPHA, 'README.md')],
      }),
    ).toEqual({ calls: [], missing: [] });
  });
});
