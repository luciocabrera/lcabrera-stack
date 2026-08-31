import { describe, expect, test } from 'vite-plus/test';

import {
  checkPeerVersion,
  declaredPeerNames,
  installedPeerVersion,
  unmetPeers,
} from './peer.mjs';

const notInstalled = () => {
  const error = new Error("Cannot find module '@repo/absent/package.json'");
  error.code = 'MODULE_NOT_FOUND';
  throw error;
};

describe('installedPeerVersion', () => {
  test('answers undefined instead of throwing when the peer is absent', () => {
    expect(() =>
      installedPeerVersion({
        from: '/anywhere/package.json',
        packageName: '@repo/absent',
        readManifest: notInstalled,
      }),
    ).not.toThrow();
    expect(
      installedPeerVersion({
        from: '/anywhere/package.json',
        packageName: '@repo/absent',
        readManifest: notInstalled,
      }),
    ).toBeUndefined();
  });

  test('reads the version when the peer is there', () => {
    expect(
      installedPeerVersion({
        from: '/anywhere/package.json',
        packageName: '@repo/present',
        readManifest: () => ({ name: '@repo/present', version: '1.4.2' }),
      }),
    ).toBe('1.4.2');
  });

  test('treats a manifest with no usable version as absent', () => {
    const readings = [{}, { version: 7 }, { version: '' }, undefined, null];
    expect(
      readings.map((manifest) =>
        installedPeerVersion({
          from: '/anywhere/package.json',
          packageName: '@repo/odd',
          readManifest: () => manifest,
        }),
      ),
    ).toEqual(readings.map(() => undefined));
  });
});

describe('checkPeerVersion', () => {
  test('separates in-range, out-of-range and absent', () => {
    expect(
      [
        { installedVersion: '0.5.0', range: '>=0.1.0 <1.0.0' },
        { installedVersion: '1.0.0', range: '>=0.1.0 <1.0.0' },
        { installedVersion: '0.0.9', range: '>=0.1.0 <1.0.0' },
        { installedVersion: undefined, range: '>=0.1.0 <1.0.0' },
      ].map(checkPeerVersion),
    ).toEqual(['ok', 'out-of-range', 'out-of-range', 'not-installed']);
  });

  test('reads the operators a hand-rolled comparator gets wrong', () => {
    expect(
      [
        { installedVersion: '1.9.9', range: '^1.2.3' },
        { installedVersion: '2.0.0', range: '^1.2.3' },
        { installedVersion: '0.2.9', range: '^0.2.3' },
        { installedVersion: '0.3.0', range: '^0.2.3' },
        { installedVersion: '10.0.0', range: '>=9.0.0' },
        { installedVersion: '2.5.0', range: '1.x || >=2.5.0 <3.0.0' },
        { installedVersion: '4.0.0', range: '*' },
      ].map(checkPeerVersion),
    ).toEqual(['ok', 'out-of-range', 'ok', 'out-of-range', 'ok', 'ok', 'ok']);
  });

  test('excludes a prerelease the range does not name, and admits one it does', () => {
    expect(
      checkPeerVersion({ installedVersion: '2.0.0-beta.1', range: '>=1.0.0' }),
    ).toBe('out-of-range');
    expect(
      checkPeerVersion({
        installedVersion: '2.0.0-beta.1',
        range: '>=2.0.0-alpha.1',
      }),
    ).toBe('ok');
  });

  test('refuses rather than passes when the range cannot be read', () => {
    expect(
      checkPeerVersion({ installedVersion: '1.0.0', range: 'not a range' }),
    ).toBe('out-of-range');
    expect(
      checkPeerVersion({ installedVersion: 'not a version', range: '>=1.0.0' }),
    ).toBe('out-of-range');
  });
});

describe('unmetPeers', () => {
  const peers = [
    { name: '@repo/absent', range: '>=0.1.0' },
    { name: '@repo/stale', range: '>=2.0.0' },
    { name: '@repo/fine', range: '>=1.0.0' },
  ];
  const versions = new Map([
    ['@repo/stale', '1.4.2'],
    ['@repo/fine', '1.4.2'],
  ]);

  test('names only what is unmet, and says which way it is unmet', () => {
    expect(unmetPeers({ peers, versions })).toEqual([
      '@repo/absent@>=0.1.0 (not installed)',
      '@repo/stale@>=2.0.0 (installed 1.4.2)',
    ]);
  });

  test('finds nothing to report when every peer answers its range', () => {
    expect(unmetPeers({ peers: [peers[2]], versions })).toEqual([]);
  });

  test('with no versions supplied, every declared peer reads as absent', () => {
    expect(unmetPeers({ peers: [peers[2]] })).toEqual([
      '@repo/fine@>=1.0.0 (not installed)',
    ]);
  });
});

describe('declaredPeerNames', () => {
  const asset = (name, ...peers) => ({
    content: ['---', `peer: [${peers.join(', ')}]`, '---', '', 'Body.'].join(
      '\n',
    ),
    path: `skills/${name}/SKILL.md`,
  });

  test('names each distinct peer once across every asset', () => {
    expect(
      declaredPeerNames([
        asset('one', "'@repo/a@^1.0.0'", "'@repo/b@^1.0.0'"),
        asset('two', "'@repo/a@^2.0.0'"),
        { content: 'no frontmatter at all', path: 'rules/plain.md' },
      ]),
    ).toEqual(['@repo/a', '@repo/b']);
  });

  test('is empty when nothing declares a peer', () => {
    expect(
      declaredPeerNames([{ content: '# Heading', path: 'rules/plain.md' }]),
    ).toEqual([]);
  });
});
