/*
 * A range a command writes into a created repository from a named constant,
 * rather than copying from a shipped asset, held by the same judgement as the
 * assets' ranges (#1206).
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  constantRanges,
  findingLine,
  passLine,
  shippedRangeFindings,
} from './shipped-ranges.mjs';
import {
  ALL_MENTIONS,
  CONSTANT,
  CONSTANT_DECLARATIONS,
  CONSTANT_RANGES,
  EVERY_SHAPE,
  MANIFEST_DECLARATIONS,
  MODULE,
  VERSIONS,
  YAML_DECLARATIONS,
} from './shipped-ranges-fixtures.mjs';

const findingsFor = (ranges) =>
  shippedRangeFindings({
    declarations: [
      ...MANIFEST_DECLARATIONS,
      ...YAML_DECLARATIONS,
      ...constantRanges({ constant: CONSTANT, path: MODULE, ranges }),
    ],
    mentions: ALL_MENTIONS,
    sources: EVERY_SHAPE,
    versions: VERSIONS,
  });

describe('constantRanges', () => {
  it('reads each entry with the constant it sits in', () => {
    expect(
      constantRanges({
        constant: CONSTANT,
        path: MODULE,
        ranges: CONSTANT_RANGES,
      }),
    ).toEqual(CONSTANT_DECLARATIONS);
  });
});

describe('shippedRangeFindings — a range constant', () => {
  it('passes while the constant admits the current version and the next minor', () => {
    expect(findingsFor(CONSTANT_RANGES)).toEqual([]);
  });

  it('reports a range the published version has left, naming the constant', () => {
    const [finding, ...rest] = findingsFor({
      '@lcabrera/tsconfig': '>=0.1.0 <0.2.0',
    });

    expect(rest).toEqual([]);
    expect(finding.kind).toBe('excludes-current');
    expect(findingLine(finding)).toContain(`${MODULE}:${CONSTANT}`);
    expect(findingLine(finding)).toContain('write `>=0.2.2 <1.0.0`');
  });

  it('reports a caret that stops short of the next minor', () => {
    const [finding] = findingsFor({ '@lcabrera/tsconfig': '^0.2.2' });

    expect(finding.kind).toBe('excludes-next-minor');
  });

  it('reports an entry naming a package this repository does not publish', () => {
    const [finding, ...rest] = findingsFor({
      ...CONSTANT_RANGES,
      '@lcabrera/gone': '>=0.1.0 <1.0.0',
    });

    expect(rest).toEqual([]);
    expect(finding.kind).toBe('unpublished');
    expect(findingLine(finding)).toContain(`${MODULE}:${CONSTANT}`);
    expect(findingLine(finding)).toContain('@lcabrera/gone');
  });

  it('refuses a pass when the constant yields no entry', () => {
    const [finding, ...rest] = findingsFor({});

    expect(rest).toEqual([]);
    expect(finding.kind).toBe('no-declarations');
    expect(findingLine(finding)).toContain(`${MODULE}:${CONSTANT}`);
    expect(findingLine(finding)).toContain('range constant');
  });

  it('refuses a pass for an empty constant beside a full one in the same file', () => {
    const other = 'OTHER_RANGES';
    const findings = shippedRangeFindings({
      declarations: [
        ...MANIFEST_DECLARATIONS,
        ...YAML_DECLARATIONS,
        ...CONSTANT_DECLARATIONS,
        ...constantRanges({ constant: other, path: MODULE, ranges: {} }),
      ],
      mentions: ALL_MENTIONS,
      sources: [
        ...EVERY_SHAPE,
        { constant: other, kind: 'constant', path: MODULE },
      ],
      versions: VERSIONS,
    });

    expect(findings.map(({ constant, kind }) => ({ constant, kind }))).toEqual([
      { constant: other, kind: 'no-declarations' },
    ]);
    expect(findingLine(findings[0])).toContain(`${MODULE}:${other}`);
  });
});

describe('passLine', () => {
  it('counts each thing under the label that names it', () => {
    const line = passLine({
      declarations: [...MANIFEST_DECLARATIONS, ...YAML_DECLARATIONS],
      mentions: ALL_MENTIONS,
      sources: [
        ...EVERY_SHAPE,
        { kind: 'scanned', path: 'workflows/check.yml' },
      ],
    });

    expect(line).toContain(
      '3 declaration(s) read from 2 shipped file(s) and 1 range constant(s)',
    );
    expect(line).toContain(
      '3 shipped data file(s) scanned for a package this repository publishes, 3 mention(s) found',
    );
  });
});
