/*
 * The states a shipped range can be in relative to the version this repository
 * publishes, and the one that has no reporter without this gate: a range that
 * is valid, current today, and excludes the release that ships next (#1129).
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  catalogRanges,
  findingLine,
  manifestRanges,
  shippedRangeFindings,
} from './shipped-ranges.mjs';

const CATALOG = [
  'packages:',
  '  - packages/*',
  '',
  'engineStrict: true',
  '',
  'catalogs:',
  '  build:',
  '    typescript: ^6.0.3',
  '    # keep in lockstep with the toolchain release',
  '    vite: npm:@voidzero-dev/vite-plus-core@0.3.0',
  '',
  '  stack:',
  "    '@lcabrera/tsconfig': '>=0.2.2 <1.0.0'",
  "    '@lcabrera/vite-config': ^0.4.1",
  '',
].join('\n');

const VERSIONS = {
  '@lcabrera/tsconfig': '0.2.2',
  '@lcabrera/vite-config': '0.5.0',
};

describe('catalogRanges', () => {
  const found = catalogRanges({ path: 'pnpm-workspace.yaml', text: CATALOG });

  it('reads a quoted key and strips the quotes from the range', () => {
    expect(found).toContainEqual({
      line: 13,
      name: '@lcabrera/tsconfig',
      path: 'pnpm-workspace.yaml',
      range: '>=0.2.2 <1.0.0',
    });
  });

  it('reads an unquoted entry beside it', () => {
    expect(found).toContainEqual({
      line: 14,
      name: '@lcabrera/vite-config',
      path: 'pnpm-workspace.yaml',
      range: '^0.4.1',
    });
  });

  it('reads no group header, no list item and no comment line as a range', () => {
    expect(found.map(({ name }) => name)).toEqual([
      'typescript',
      'vite',
      '@lcabrera/tsconfig',
      '@lcabrera/vite-config',
    ]);
  });
});

describe('manifestRanges', () => {
  const found = manifestRanges({
    manifest: {
      dependencies: { '@lcabrera/ui': 'catalog:stack' },
      devDependencies: {
        '@lcabrera/tsconfig': '^0.2.2',
        '@repo/typescript-config': 'workspace:*',
      },
    },
    path: 'package.json',
  });

  it('reads a literal range with the field it sits in', () => {
    expect(found).toEqual([
      {
        field: 'devDependencies',
        name: '@lcabrera/tsconfig',
        path: 'package.json',
        range: '^0.2.2',
      },
    ]);
  });
});

describe('shippedRangeFindings', () => {
  const declare = (range) => [
    { line: 1, name: '@lcabrera/vite-config', path: 'shipped.yaml', range },
  ];

  it('reports a range that excludes the version this repository publishes', () => {
    const [finding] = shippedRangeFindings({
      declarations: declare('^0.4.1'),
      versions: VERSIONS,
    });

    expect(finding.kind).toBe('excludes-current');
    expect(findingLine(finding)).toContain('>=0.5.0 <1.0.0');
  });

  it('reports a range that is current but excludes the next minor', () => {
    const [finding] = shippedRangeFindings({
      declarations: declare('^0.5.0'),
      versions: VERSIONS,
    });

    expect(finding.kind).toBe('excludes-next-minor');
    expect(findingLine(finding)).toContain('0.6.0');
  });

  it('accepts a range that admits every release up to the next major', () => {
    expect(
      shippedRangeFindings({
        declarations: declare('>=0.5.0 <1.0.0'),
        versions: VERSIONS,
      }),
    ).toEqual([]);
  });

  it('accepts a caret once the package is past 1.0.0', () => {
    expect(
      shippedRangeFindings({
        declarations: declare('^1.2.3'),
        versions: { '@lcabrera/vite-config': '1.2.3' },
      }),
    ).toEqual([]);
  });

  it('reports a range that is not a range at all', () => {
    const [finding] = shippedRangeFindings({
      declarations: declare('latest-ish'),
      versions: VERSIONS,
    });

    expect(finding.kind).toBe('malformed');
  });

  it('judges no range for a package this repository does not publish', () => {
    expect(
      shippedRangeFindings({
        declarations: [
          {
            line: 1,
            name: 'typescript',
            path: 'shipped.yaml',
            range: '^6.0.3',
          },
          ...declare('>=0.5.0 <1.0.0'),
        ],
        versions: VERSIONS,
      }),
    ).toEqual([]);
  });

  it('refuses a pass when nothing shipped was read', () => {
    const [finding] = shippedRangeFindings({
      declarations: [],
      versions: VERSIONS,
    });

    expect(finding.kind).toBe('nothing-read');
    expect(findingLine(finding)).toContain('stopped reading');
  });
});
