import { describe, expect, it } from 'vite-plus/test';

import {
  formatFinding,
  incompleteReason,
  parseReport,
  reportFindings,
} from './fallow-gate-report.mjs';

describe('reportFindings', () => {
  it('lists every suppression marker in the report', () => {
    expect(
      reportFindings({
        analysis: 'suppressions',
        report: {
          files: [
            {
              path: 'a.ts',
              suppressions: [
                { kind: 'complexity', line: 3, reason: 'legacy' },
                { kind: 'unused-export', line: 9 },
              ],
            },
          ],
        },
      }),
    ).toEqual([
      { detail: 'fallow-ignore complexity (legacy)', line: 3, path: 'a.ts' },
      { detail: 'fallow-ignore unused-export', line: 9, path: 'a.ts' },
    ]);
  });

  it('reads a file entry with no suppressions key as clean', () => {
    expect(
      reportFindings({
        analysis: 'suppressions',
        report: { files: [{ path: 'a.ts' }] },
      }),
    ).toEqual([]);
  });

  it('reads a suppression report with no files as clean', () => {
    expect(reportFindings({ analysis: 'suppressions', report: {} })).toEqual(
      [],
    );
  });

  const gaps = {
    coverage_gaps: {
      exports: [
        { export_name: 'added', line: 4, path: 'a.ts' },
        { export_name: 'old', line: 9, path: 'a.ts' },
        { export_name: 'fresh', line: 1, path: 'new.ts' },
        { export_name: 'elsewhere', line: 4, path: 'b.ts' },
      ],
      files: [{ path: 'a.ts' }, { path: 'new.ts' }, { path: 'b.ts' }],
    },
  };
  const introduced = new Map([
    ['a.ts', { isNew: false, ranges: [[3, 5]] }],
    ['new.ts', { isNew: true, ranges: [] }],
  ]);

  it('keeps only the coverage gaps the change introduced', () => {
    expect(
      reportFindings({ analysis: 'coverage-gaps', introduced, report: gaps }),
    ).toEqual([
      { detail: 'no test reaches this file', path: 'new.ts' },
      { detail: 'no test reaches the export `added`', line: 4, path: 'a.ts' },
      { detail: 'no test reaches the export `fresh`', line: 1, path: 'new.ts' },
    ]);
  });

  it.each([
    [2, false],
    [3, true],
    [5, true],
    [6, false],
  ])(
    'attributes an export on line %i to a hunk over lines 3-5: %s',
    (line, kept) => {
      expect(
        reportFindings({
          analysis: 'coverage-gaps',
          introduced: new Map([['a.ts', { isNew: false, ranges: [[3, 5]] }]]),
          report: {
            coverage_gaps: {
              exports: [{ export_name: 'x', line, path: 'a.ts' }],
              files: [],
            },
          },
        }),
      ).toHaveLength(kept ? 1 : 0);
    },
  );

  it.each([
    [
      { files: [{ path: 'new.ts' }] },
      [{ detail: 'no test reaches this file', path: 'new.ts' }],
    ],
    [
      { exports: [{ export_name: 'fresh', line: 1, path: 'new.ts' }] },
      [
        {
          detail: 'no test reaches the export `fresh`',
          line: 1,
          path: 'new.ts',
        },
      ],
    ],
  ])(
    'reads a coverage section that carries only one of its lists: %o',
    (section, expected) => {
      expect(
        reportFindings({
          analysis: 'coverage-gaps',
          introduced,
          report: { coverage_gaps: section },
        }),
      ).toEqual(expected);
    },
  );

  it('reads a health report without a coverage section as clean', () => {
    expect(
      reportFindings({ analysis: 'coverage-gaps', introduced, report: {} }),
    ).toEqual([]);
  });

  it('names both ends of a similar-code candidate', () => {
    expect(
      reportFindings({
        analysis: 'similar-code',
        report: {
          candidates: [
            {
              left: { name: 'sumA', path: 'a.ts', start_line: 2 },
              right: { name: 'sumB', path: 'b.ts', start_line: 7 },
              similarity: 0.934,
            },
          ],
        },
      }),
    ).toEqual([
      {
        detail: 'sumA is similar to sumB at b.ts:7 (similarity 0.93)',
        line: 2,
        path: 'a.ts',
      },
    ]);
  });

  it('reads a similar-code report without candidates as clean', () => {
    expect(reportFindings({ analysis: 'similar-code', report: {} })).toEqual(
      [],
    );
  });
});

describe('incompleteReason', () => {
  it('accepts a complete similar-code run', () => {
    expect(
      incompleteReason({
        analysis: 'similar-code',
        report: { completion: { status: 'complete' } },
      }),
    ).toBeUndefined();
  });

  it('refuses a partial similar-code run', () => {
    expect(
      incompleteReason({
        analysis: 'similar-code',
        report: { completion: { status: 'partial' } },
      }),
    ).toBe(
      'similar-code finished with completion "partial", so an empty candidate list is not conclusive',
    );
  });

  it('refuses a similar-code run that reports no completion', () => {
    expect(
      incompleteReason({ analysis: 'similar-code', report: {} }),
    ).toContain('"missing"');
  });

  it('has nothing to say about the other reports', () => {
    expect(
      incompleteReason({ analysis: 'suppressions', report: {} }),
    ).toBeUndefined();
  });
});

describe('formatFinding', () => {
  it('prints the line when there is one', () => {
    expect(formatFinding({ detail: 'x', line: 3, path: 'a.ts' })).toBe(
      'a.ts:3  x',
    );
  });

  it('prints the path alone for a whole-file finding', () => {
    expect(formatFinding({ detail: 'x', path: 'a.ts' })).toBe('a.ts  x');
  });
});

describe('parseReport', () => {
  it('skips anything printed before the JSON object', () => {
    expect(parseReport('banner\n{"kind":"x"}')).toEqual({ kind: 'x' });
  });

  it('fails when there is no JSON object at all', () => {
    expect(() => parseReport('Error: nope')).toThrow(
      'fallow printed no JSON report',
    );
  });
});
