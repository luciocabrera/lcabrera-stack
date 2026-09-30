/*
 * A range a command writes into a created repository from a named constant,
 * rather than copying from a shipped asset, held by the same judgement as the
 * assets' ranges (#1206).
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  constantRanges,
  findingLine,
  shippedRangeFindings,
} from './shipped-ranges.mjs';
import {
  ALL_MENTIONS,
  BOTH_SHAPES,
  MANIFEST_DECLARATIONS,
  YAML_DECLARATIONS,
} from './shipped-ranges-fixtures.mjs';

const SOURCE = 'packages/devkit/scripts/create.mjs';

const CONSTANT = 'TOOLCHAIN_RANGES';

const CONSTANT_SOURCE = { constant: CONSTANT, kind: 'constant', path: SOURCE };

const VERSIONS = {
  '@lcabrera/devkit': '0.5.1',
  '@lcabrera/tsconfig': '0.2.2',
  '@lcabrera/vite-config': '0.5.0',
};

const findingsFor = (ranges) =>
  shippedRangeFindings({
    declarations: [
      ...MANIFEST_DECLARATIONS,
      ...YAML_DECLARATIONS,
      ...constantRanges({ constant: CONSTANT, path: SOURCE, ranges }),
    ],
    mentions: ALL_MENTIONS,
    sources: [...BOTH_SHAPES, CONSTANT_SOURCE],
    versions: VERSIONS,
  });

describe('constantRanges', () => {
  it('reads each entry with the constant it sits in', () => {
    expect(
      constantRanges({
        constant: CONSTANT,
        path: SOURCE,
        ranges: { '@lcabrera/devkit': '>=0.5.1 <1.0.0' },
      }),
    ).toEqual([
      {
        constant: CONSTANT,
        field: CONSTANT,
        name: '@lcabrera/devkit',
        path: SOURCE,
        range: '>=0.5.1 <1.0.0',
      },
    ]);
  });
});

describe('shippedRangeFindings — a range constant', () => {
  it('passes while the constant admits the current version and the next minor', () => {
    expect(findingsFor({ '@lcabrera/devkit': '>=0.5.1 <1.0.0' })).toEqual([]);
  });

  it('reports a range the published version has left, naming the constant', () => {
    const [finding, ...rest] = findingsFor({
      '@lcabrera/devkit': '>=0.4.0 <0.5.0',
    });

    expect(rest).toEqual([]);
    expect(finding.kind).toBe('excludes-current');
    expect(findingLine(finding)).toContain(`${SOURCE}:${CONSTANT}`);
    expect(findingLine(finding)).toContain('write `>=0.5.1 <1.0.0`');
  });

  it('reports a caret that stops short of the next minor', () => {
    const [finding] = findingsFor({ '@lcabrera/devkit': '^0.5.1' });

    expect(finding.kind).toBe('excludes-next-minor');
  });

  it('reports an entry naming a package this repository does not publish', () => {
    const [finding, ...rest] = findingsFor({
      '@lcabrera/devkit': '>=0.5.1 <1.0.0',
      '@lcabrera/gone': '>=0.1.0 <1.0.0',
    });

    expect(rest).toEqual([]);
    expect(finding.kind).toBe('unpublished');
    expect(findingLine(finding)).toContain(`${SOURCE}:${CONSTANT}`);
    expect(findingLine(finding)).toContain('@lcabrera/gone');
  });

  it('refuses a pass when the constant yields no entry', () => {
    const [finding, ...rest] = findingsFor({});

    expect(rest).toEqual([]);
    expect(finding.kind).toBe('no-declarations');
    expect(findingLine(finding)).toContain(`${SOURCE}:${CONSTANT}`);
    expect(findingLine(finding)).toContain('range constant');
  });
});
