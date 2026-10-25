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
  const touches = [
    {
      dir: 'packages/alpha',
      name: '@s/alpha',
      path: 'packages/alpha/README.md',
      side: 'head',
    },
  ];
  const shipped = new Map([['head:packages/alpha', new Set(['README.md'])]]);

  it('asks nothing of a package the change no longer publishes', () => {
    expect(
      missingChangesets({
        manifests: { base: [ALPHA], head: [{ ...ALPHA, private: true }] },
        namedPackages: new Set(),
        shipped,
        touches,
      }),
    ).toEqual([]);
  });

  it('asks nothing of a package absent at the base', () => {
    expect(
      missingChangesets({
        manifests: { base: [], head: [ALPHA] },
        namedPackages: new Set(),
        shipped,
        touches,
      }),
    ).toEqual([]);
  });

  it('names the package and its shipped file otherwise', () => {
    expect(
      missingChangesets({
        manifests: { base: [ALPHA], head: [ALPHA] },
        namedPackages: new Set(),
        shipped,
        touches,
      }),
    ).toEqual([{ files: ['packages/alpha/README.md'], name: '@s/alpha' }]);
  });
});
