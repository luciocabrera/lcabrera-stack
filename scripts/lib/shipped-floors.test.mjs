/*
 * A shipped range whose floor sits below the version this repository publishes
 * lets a created repository resolve a release older than the one that wrote it
 * (#1219). The gate reports such a floor, and `devkit:pins` raises it.
 */
import { describe, expect, it } from 'vite-plus/test';

import { withRaisedFloors, raisedRange } from './shipped-floors.mjs';
import {
  catalogRanges,
  constantRanges,
  findingLine,
  manifestRanges,
  shippedRangeFindings,
} from './shipped-ranges.mjs';

const VERSIONS = {
  '@lcabrera/tsconfig': '0.2.2',
  '@lcabrera/vite-config': '0.6.1',
};

const MANIFEST_PATH = 'apps/web/package.json';

const CATALOG_PATH = 'pnpm-workspace.yaml';

const MODULE = 'create.mjs';

const CONSTANT = 'TOOLCHAIN_RANGES';

const manifestText = (range) =>
  `${JSON.stringify(
    {
      dependencies: { '@lcabrera/vite-config': range, react: '^19.2.8' },
      devDependencies: { '@lcabrera/tsconfig': '>=0.2.2 <1.0.0' },
      name: 'web',
    },
    undefined,
    2,
  )}\n`;

const catalogText = (range) =>
  [
    'catalogs:',
    '  stack:',
    "    '@lcabrera/tsconfig': '>=0.2.2 <1.0.0'",
    `    '@lcabrera/vite-config': '${range}'`,
    '',
  ].join('\n');

const moduleText = (range) =>
  [
    'export const TOOLCHAIN_RANGES = {',
    `  [VITE_CONFIG]: '${range}',`,
    '};',
    '',
  ].join('\n');

const sourcesOf = (range) => [
  { kind: 'manifest', path: MANIFEST_PATH, text: manifestText(range) },
  { kind: 'catalog', path: CATALOG_PATH, text: catalogText(range) },
  {
    constant: CONSTANT,
    kind: 'constant',
    path: MODULE,
    ranges: { '@lcabrera/vite-config': range },
    text: moduleText(range),
  },
];

const declarationsOf = (source) => {
  if (source.kind === 'manifest') {
    return manifestRanges({
      manifest: JSON.parse(source.text),
      path: source.path,
    });
  }
  if (source.kind === 'catalog') return catalogRanges(source);
  return constantRanges(source);
};

const findingsFor = (sources) =>
  shippedRangeFindings({
    declarations: sources.flatMap(declarationsOf),
    mentions: [
      { name: '@lcabrera/vite-config', path: MANIFEST_PATH },
      { name: '@lcabrera/vite-config', path: CATALOG_PATH },
    ],
    sources,
    versions: VERSIONS,
  });

const raised = (sources) =>
  sources.map((source) => ({
    ...source,
    text: withRaisedFloors({
      declarations: declarationsOf(source),
      kind: source.kind,
      text: source.text,
      versions: VERSIONS,
    }),
  }));

describe('shippedRangeFindings — a floor below the published version', () => {
  it('passes a band that starts at the published version', () => {
    expect(findingsFor(sourcesOf('>=0.6.1 <1.0.0'))).toEqual([]);
  });

  it('reports a planted low floor in every shape, with the range to write', () => {
    const findings = findingsFor(sourcesOf('>=0.5.0 <1.0.0'));

    expect(findings.map(({ kind, path }) => ({ kind, path }))).toEqual([
      { kind: 'floor-below-current', path: MANIFEST_PATH },
      { kind: 'floor-below-current', path: CATALOG_PATH },
      { kind: 'floor-below-current', path: MODULE },
    ]);
    expect(findingLine(findings[0])).toContain(
      'admits releases older than 0.6.1',
    );
    expect(findingLine(findings[0])).toContain('write `>=0.6.1 <1.0.0`');
  });
});

describe('raisedRange', () => {
  it('raises a band floor and keeps its ceiling', () => {
    expect(raisedRange({ range: '>=0.5.0 <1.0.0', version: '0.6.1' })).toBe(
      '>=0.6.1 <1.0.0',
    );
  });

  it('leaves a floor already at the published version alone', () => {
    expect(raisedRange({ range: '>=0.6.1 <1.0.0', version: '0.6.1' })).toBe(
      '>=0.6.1 <1.0.0',
    );
  });

  it('leaves a place, which declares no version here, alone', () => {
    expect(raisedRange({ range: 'catalog:stack', version: '0.6.1' })).toBe(
      'catalog:stack',
    );
  });

  it('refuses a raise that would pass its ceiling', () => {
    expect(() =>
      raisedRange({ range: '>=0.9.0 <1.0.0', version: '1.0.0' }),
    ).toThrow('its ceiling has to move by hand');
  });

  it('refuses a floor it cannot find written in the range', () => {
    expect(() => raisedRange({ range: '>=0.5 <1', version: '0.6.1' })).toThrow(
      'no literal floor',
    );
  });
});

describe('withRaisedFloors', () => {
  it('leaves the gate nothing to report on a planted low floor', () => {
    const after = raised(sourcesOf('>=0.5.0 <1.0.0')).map((source) =>
      source.kind === 'constant'
        ? { ...source, ranges: { '@lcabrera/vite-config': '>=0.6.1 <1.0.0' } }
        : source,
    );

    expect(findingsFor(after)).toEqual([]);
  });

  it('rewrites only the range it raises, byte for byte', () => {
    const [manifest, catalog, module] = raised(sourcesOf('>=0.5.0 <1.0.0'));

    expect(manifest.text).toBe(manifestText('>=0.6.1 <1.0.0'));
    expect(catalog.text).toBe(catalogText('>=0.6.1 <1.0.0'));
    expect(module.text).toBe(moduleText('>=0.6.1 <1.0.0'));
  });

  it('is a no-op on a tree already in step', () => {
    const inStep = sourcesOf('>=0.6.1 <1.0.0');

    expect(raised(inStep).map(({ text }) => text)).toEqual(
      inStep.map(({ text }) => text),
    );
  });

  it('refuses a constant whose range it cannot place exactly once', () => {
    expect(() =>
      withRaisedFloors({
        declarations: constantRanges({
          constant: CONSTANT,
          path: MODULE,
          ranges: { '@lcabrera/vite-config': '>=0.5.0 <1.0.0' },
        }),
        kind: 'constant',
        text: `${moduleText('>=0.5.0 <1.0.0')}${moduleText('>=0.5.0 <1.0.0')}`,
        versions: VERSIONS,
      }),
    ).toThrow('found 2');
  });
});
