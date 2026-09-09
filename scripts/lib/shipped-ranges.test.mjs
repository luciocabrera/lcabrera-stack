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
  sourceOf,
} from './shipped-ranges.mjs';
import {
  ALL_MENTIONS,
  BOTH_SHAPES,
  CATALOG,
  MANIFEST,
  MANIFEST_DECLARATIONS,
  VERSIONS,
  YAML,
  YAML_DECLARATIONS,
} from './shipped-ranges-fixtures.mjs';

const mentionsOf = (declarations) =>
  declarations
    .filter(({ name }) => VERSIONS[name] !== undefined)
    .map(({ name, path }) => ({ name, path }));

const findingsFor = ({
  declarations,
  mentions,
  sources = BOTH_SHAPES,
  versions = VERSIONS,
}) =>
  shippedRangeFindings({
    declarations,
    mentions: mentions ?? mentionsOf(declarations),
    sources,
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

describe('sourceOf', () => {
  it.each([
    { file: 'package.json', kind: 'manifest' },
    { file: 'pnpm-workspace.yaml', kind: 'catalog' },
  ])('reads $file as a $kind', ({ file, kind }) => {
    expect(sourceOf(file)?.kind).toBe(kind);
  });

  it.each(['package.jsonc', 'package.json5', 'biome.jsonc', 'check.yml'])(
    'scans %s for names even though no reader parses it',
    (file) => {
      expect(sourceOf(file)?.kind).toBe('scanned');
    },
  );

  it('is nothing to this gate for a file that carries no data', () => {
    expect(sourceOf('README.md')).toBeUndefined();
  });

  it.each([
    { file: 'pnpm-workspace.yaml', hashComments: true },
    { file: 'package.json', hashComments: false },
    { file: 'biome.jsonc', hashComments: false },
  ])(
    'says whether $file has hash comments to drop',
    ({ file, hashComments }) => {
      expect(sourceOf(file)?.hashComments).toBe(hashComments);
    },
  );
});

describe('mentionsIn', () => {
  const names = [...Object.keys(VERSIONS), '@lcabrera/node', '@lcabrera/ui'];

  it('names every published package the text holds, and no other', () => {
    expect(
      mentionsIn({ names: Object.keys(VERSIONS), path: YAML, text: CATALOG }),
    ).toEqual([
      { name: '@lcabrera/tsconfig', path: YAML },
      { name: '@lcabrera/vite-config', path: YAML },
    ]);
  });

  it('reads no name out of a comment, in a syntax that has them', () => {
    expect(
      mentionsIn({
        hashComments: true,
        names,
        path: YAML,
        text: '  # @lcabrera/ui is installed by the application, not catalogued\n',
      }),
    ).toEqual([]);
  });

  it('reads a name out of JSON holding a hash, which is no comment there', () => {
    expect(
      mentionsIn({
        names,
        path: MANIFEST,
        text: '{"description":"a # b","devDependencies":{"@lcabrera/tsconfig":"^0.2.2"}}',
      }),
    ).toEqual([{ name: '@lcabrera/tsconfig', path: MANIFEST }]);
  });

  it('reads a whole token, so a longer name is not also the shorter one', () => {
    expect(
      mentionsIn({
        names,
        path: MANIFEST,
        text: '    "@lcabrera/node-runtime-helper": "^1.0.0",\n',
      }),
    ).toEqual([]);
  });
});

describe('shippedRangeFindings — a shape the walk stopped reaching', () => {
  it.each([
    {
      missing: 'workspace catalog',
      sources: [{ kind: 'manifest', path: MANIFEST }],
    },
    { missing: 'manifest', sources: [{ kind: 'catalog', path: YAML }] },
  ])('refuses a pass when no $missing was read', ({ missing, sources }) => {
    const findings = findingsFor({
      declarations: [...MANIFEST_DECLARATIONS, ...YAML_DECLARATIONS],
      sources,
    });

    expect(findings.map(({ kind, shape }) => ({ kind, shape }))).toEqual([
      { kind: 'no-source', shape: missing },
    ]);
    expect(findingLine(findings[0])).toContain(missing);
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

  it.each(['catalog:stack', 'workspace:*'])(
    'judges no `%s`, because it names where the version is declared',
    (place) => {
      expect(findingsFor({ declarations: declare(place) })).toEqual([]);
    },
  );

  it.each([
    'npm:@lcabrera/vite-config@0.4.1',
    'https://example.invalid/vite-config.tgz',
    'file:../vite-config',
  ])(
    'judges `%s`, which pins an artifact rather than naming a place',
    (pin) => {
      const [finding] = findingsFor({ declarations: declare(pin) });

      expect(finding.kind).toBe('malformed');
      expect(findingLine(finding)).toContain('>=0.5.0 <1.0.0');
    },
  );

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
      expected: [
        { kind: 'no-declarations', path: YAML },
        { kind: 'unread', name: '@lcabrera/tsconfig', path: YAML },
        { kind: 'unread', name: '@lcabrera/vite-config', path: YAML },
      ],
      quiet: 'catalog',
    },
    {
      answering: YAML_DECLARATIONS,
      expected: [
        { kind: 'unread', name: '@lcabrera/tsconfig', path: MANIFEST },
      ],
      quiet: 'manifest',
    },
  ])(
    'fails when the $quiet reader yields nothing, though the other still does',
    ({ answering, expected }) => {
      const findings = findingsFor({
        declarations: answering,
        mentions: ALL_MENTIONS,
      });

      expect(
        findings.map(({ kind, name, path }) => ({ kind, name, path })),
      ).toEqual(expected);
      expect(findingLine(findings[0])).toContain(expected[0].path);
    },
  );

  it('counts a name read in one file as unread in the other', () => {
    const findings = findingsFor({
      declarations: YAML_DECLARATIONS,
      mentions: [{ name: '@lcabrera/tsconfig', path: MANIFEST }],
    });

    expect(findings.map(({ kind, path }) => ({ kind, path }))).toEqual([
      { kind: 'unread', path: MANIFEST },
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
