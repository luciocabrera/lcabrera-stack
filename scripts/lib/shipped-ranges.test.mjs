/*
 * The states a shipped range can be in relative to the version this repository
 * publishes, and the two with no reporter without this gate: a range that is
 * valid, current today, and excludes the release that ships next; and a reader
 * that has gone quiet on one of the shipped files while the other still answers
 * (#1129).
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  catalogRanges,
  findingLine,
  manifestRanges,
  mentionsIn,
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

const YAML = 'pnpm-workspace.yaml';
const MANIFEST = 'package.json';

const mentionsOf = (declarations) =>
  declarations
    .filter(({ name }) => VERSIONS[name] !== undefined)
    .map(({ name, path }) => ({ name, path }));

const findingsFor = ({ declarations, mentions, versions = VERSIONS }) =>
  shippedRangeFindings({
    declarations,
    mentions: mentions ?? mentionsOf(declarations),
    versions,
  });

describe('catalogRanges', () => {
  const found = catalogRanges({ path: YAML, text: CATALOG });

  it('reads a quoted key and strips the quotes from the range', () => {
    expect(found).toContainEqual({
      line: 13,
      name: '@lcabrera/tsconfig',
      path: YAML,
      range: '>=0.2.2 <1.0.0',
    });
  });

  it('reads an unquoted entry beside it', () => {
    expect(found).toContainEqual({
      line: 14,
      name: '@lcabrera/vite-config',
      path: YAML,
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
    path: MANIFEST,
  });

  it('reads a literal range with the field it sits in', () => {
    expect(found).toContainEqual({
      field: 'devDependencies',
      name: '@lcabrera/tsconfig',
      path: MANIFEST,
      range: '^0.2.2',
    });
  });

  it('reads a pointer too, so a name it resolves is not mistaken for one it missed', () => {
    expect(found.map(({ name }) => name)).toEqual([
      '@lcabrera/ui',
      '@lcabrera/tsconfig',
      '@repo/typescript-config',
    ]);
  });
});

describe('mentionsIn', () => {
  it('names every published package the text holds, and no other', () => {
    expect(
      mentionsIn({ names: Object.keys(VERSIONS), path: YAML, text: CATALOG }),
    ).toEqual([
      { name: '@lcabrera/tsconfig', path: YAML },
      { name: '@lcabrera/vite-config', path: YAML },
    ]);
  });
});

describe('shippedRangeFindings', () => {
  const declare = (range) => [
    { line: 1, name: '@lcabrera/vite-config', path: YAML, range },
  ];

  it('reports a range that excludes the version this repository publishes', () => {
    const [finding] = findingsFor({ declarations: declare('^0.4.1') });

    expect(finding.kind).toBe('excludes-current');
    expect(findingLine(finding)).toContain('>=0.5.0 <1.0.0');
  });

  it('reports a range that is current but excludes the next minor', () => {
    const [finding] = findingsFor({ declarations: declare('^0.5.0') });

    expect(finding.kind).toBe('excludes-next-minor');
    expect(findingLine(finding)).toContain('0.6.0');
  });

  it('accepts a range that admits every release up to the next major', () => {
    expect(findingsFor({ declarations: declare('>=0.5.0 <1.0.0') })).toEqual(
      [],
    );
  });

  it('accepts a caret once the package is past 1.0.0', () => {
    expect(
      findingsFor({
        declarations: declare('^1.2.3'),
        versions: { '@lcabrera/vite-config': '1.2.3' },
      }),
    ).toEqual([]);
  });

  it('judges no pointer, because it declares no version to fall behind', () => {
    expect(findingsFor({ declarations: declare('catalog:stack') })).toEqual([]);
  });

  it('reports a range that is not a range at all', () => {
    const [finding] = findingsFor({ declarations: declare('latest-ish') });

    expect(finding.kind).toBe('malformed');
  });

  it('judges no range for a package this repository does not publish', () => {
    expect(
      findingsFor({
        declarations: [
          { line: 1, name: 'typescript', path: YAML, range: '^6.0.3' },
          ...declare('>=0.5.0 <1.0.0'),
        ],
      }),
    ).toEqual([]);
  });
});

describe('shippedRangeFindings — a reader that has gone quiet', () => {
  const YAML_MENTIONS = [
    { name: '@lcabrera/tsconfig', path: YAML },
    { name: '@lcabrera/vite-config', path: YAML },
  ];
  const MANIFEST_MENTIONS = [{ name: '@lcabrera/tsconfig', path: MANIFEST }];

  const MANIFEST_DECLARATIONS = [
    {
      field: 'devDependencies',
      name: '@lcabrera/tsconfig',
      path: MANIFEST,
      range: '>=0.2.2 <1.0.0',
    },
  ];
  const YAML_DECLARATIONS = [
    {
      line: 51,
      name: '@lcabrera/tsconfig',
      path: YAML,
      range: '>=0.2.2 <1.0.0',
    },
    {
      line: 52,
      name: '@lcabrera/vite-config',
      path: YAML,
      range: '>=0.5.0 <1.0.0',
    },
  ];

  const ALL_MENTIONS = [...YAML_MENTIONS, ...MANIFEST_MENTIONS];

  it('passes while both readers answer', () => {
    expect(
      findingsFor({
        declarations: [...YAML_DECLARATIONS, ...MANIFEST_DECLARATIONS],
        mentions: ALL_MENTIONS,
      }),
    ).toEqual([]);
  });

  it.each([
    {
      answering: MANIFEST_DECLARATIONS,
      quiet: 'catalog',
      unread: [
        { kind: 'unread', name: '@lcabrera/tsconfig', path: YAML },
        { kind: 'unread', name: '@lcabrera/vite-config', path: YAML },
      ],
    },
    {
      answering: YAML_DECLARATIONS,
      quiet: 'manifest',
      unread: [{ kind: 'unread', name: '@lcabrera/tsconfig', path: MANIFEST }],
    },
  ])(
    'fails when the $quiet reader yields nothing, though the other still does',
    ({ answering, unread }) => {
      const findings = findingsFor({
        declarations: answering,
        mentions: ALL_MENTIONS,
      });

      expect(
        findings.map(({ kind, name, path }) => ({ kind, name, path })),
      ).toEqual(unread);
      expect(findingLine(findings[0])).toContain(unread[0].path);
    },
  );

  it('counts a name read in one file as unread in the other', () => {
    const findings = findingsFor({
      declarations: MANIFEST_DECLARATIONS,
      mentions: [{ name: '@lcabrera/tsconfig', path: YAML }],
    });

    expect(findings.map(({ kind, path }) => ({ kind, path }))).toEqual([
      { kind: 'unread', path: YAML },
    ]);
  });

  it('refuses a pass when no shipped file names a published package at all', () => {
    const [finding] = findingsFor({
      declarations: MANIFEST_DECLARATIONS,
      mentions: [],
    });

    expect(finding.kind).toBe('nothing-read');
    expect(findingLine(finding)).toContain('stopped reaching');
  });
});
