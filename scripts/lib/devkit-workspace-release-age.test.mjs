/*
 * Which exact optional pins a created tree leaves outside its release-age
 * exclusions.
 */

import { describe, expect, it } from 'vite-plus/test';

import {
  exactOptionalPins,
  excludeCovers,
  installedPackages,
  listedPaths,
  scanCoverageFindings,
  uncoveredPinFindings,
} from './devkit-workspace-release-age.mjs';

const BIOME = {
  name: '@biomejs/biome',
  optionalDependencies: {
    '@biomejs/cli-darwin-arm64': '2.6.3',
    '@biomejs/cli-linux-x64': '2.6.3',
  },
  version: '2.6.3',
};

describe('exactOptionalPins', () => {
  it('keeps the optional dependencies pinned at one version', () => {
    expect(exactOptionalPins([BIOME])).toEqual([
      {
        name: '@biomejs/cli-darwin-arm64',
        pinnedBy: '@biomejs/biome@2.6.3',
        version: '2.6.3',
      },
      {
        name: '@biomejs/cli-linux-x64',
        pinnedBy: '@biomejs/biome@2.6.3',
        version: '2.6.3',
      },
    ]);
  });

  it('ignores a range, an alias and a package with no optional dependencies', () => {
    expect(
      exactOptionalPins([
        {
          name: 'parent',
          optionalDependencies: {
            aliased: 'npm:other@1.0.0',
            ranged: '^1.0.0',
          },
          version: '1.0.0',
        },
        { name: 'plain', version: '1.0.0' },
      ]),
    ).toEqual([]);
  });
});

describe('excludeCovers', () => {
  it('matches a trailing wildcard inside a scope', () => {
    expect(
      excludeCovers({
        entry: '@biomejs/cli-*',
        name: '@biomejs/cli-linux-x64',
        version: '2.6.3',
      }),
    ).toBe(true);
  });

  it('does not let a prefix pattern reach a sibling outside it', () => {
    expect(
      excludeCovers({
        entry: '@voidzero-dev/vite-plus-linux-*',
        name: '@voidzero-dev/vite-plus-core',
        version: '1.3.0',
      }),
    ).toBe(false);
  });

  it('reads a dot in an entry literally', () => {
    expect(excludeCovers({ entry: 'a.b', name: 'axb', version: '1.0.0' })).toBe(
      false,
    );
  });

  it('holds a name@version entry to that version', () => {
    const entry = '@biomejs/cli-linux-x64@2.6.3';
    expect(
      excludeCovers({
        entry,
        name: '@biomejs/cli-linux-x64',
        version: '2.6.3',
      }),
    ).toBe(true);
    expect(
      excludeCovers({
        entry,
        name: '@biomejs/cli-linux-x64',
        version: '2.6.4',
      }),
    ).toBe(false);
  });
});

describe('uncoveredPinFindings', () => {
  const pins = exactOptionalPins([BIOME]);

  it('passes when every pin is covered', () => {
    expect(
      uncoveredPinFindings({ excluded: ['@biomejs/cli-*'], pins }),
    ).toEqual([]);
  });

  it('names the pinning package once with every pin left out', () => {
    const findings = uncoveredPinFindings({
      excluded: ['@biomejs/cli-darwin-*'],
      pins,
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('`@biomejs/biome@2.6.3`');
    expect(findings[0]).toContain('@biomejs/cli-linux-x64@2.6.3');
    expect(findings[0]).not.toContain('cli-darwin-arm64');
  });
});

describe('listedPaths', () => {
  it('collects every path at any depth once', () => {
    expect(
      listedPaths([
        {
          devDependencies: {
            a: {
              dependencies: { b: { path: '/s/b' } },
              optionalDependencies: { c: { path: '/s/c' } },
              path: '/s/a',
            },
          },
        },
        { dependencies: { b: { path: '/s/b' } } },
      ]),
    ).toEqual(['/s/a', '/s/b', '/s/c']);
  });
});

describe('installedPackages', () => {
  const lockfile = [
    '---',
    'importers:',
    '  .: {}',
    'packages:',
    "  '@pnpm/exe@12.14.0': {}",
    '---',
    'settings:',
    '  autoInstallPeers: true',
    'packages:',
    "  '@biomejs/biome@2.6.3': {}",
    "  '@biomejs/cli-win32-x64@2.6.3': {}",
    '',
  ].join('\n');

  it('reads the resolved document and leaves out what the install skipped', () => {
    expect(
      installedPackages({
        lockfile,
        modules: '{ "skipped": ["@biomejs/cli-win32-x64@2.6.3"] }',
      }),
    ).toEqual(['@biomejs/biome@2.6.3']);
  });

  it('finds nothing in a lockfile it cannot read', () => {
    expect(installedPackages({ lockfile: '', modules: '' })).toEqual([]);
  });
});

describe('scanCoverageFindings', () => {
  it('passes a scan that read every installed package', () => {
    expect(
      scanCoverageFindings({
        installed: ['a@1.0.0'],
        read: new Set(['a@1.0.0', 'workspace@0.0.0']),
      }),
    ).toEqual([]);
  });

  it('fails a scan that read no manifest', () => {
    const [finding] = scanCoverageFindings({
      installed: ['a@1.0.0', 'b@1.0.0'],
      read: new Set(),
    });
    expect(finding).toContain('read no manifest for 2 of the 2 packages');
  });

  it('fails when the lockfile names nothing to hold the scan to', () => {
    expect(
      scanCoverageFindings({ installed: [], read: new Set(['a@1.0.0']) }),
    ).toEqual([expect.stringContaining('names no installed package')]);
  });
});
