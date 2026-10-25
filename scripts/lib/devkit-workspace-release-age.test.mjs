/*
 * Which exact optional pins a created tree leaves outside its release-age
 * exclusions.
 */

import { describe, expect, it } from 'vite-plus/test';

import {
  exactOptionalPins,
  excludeCovers,
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
