import { describe, expect, it } from 'vite-plus/test';

import {
  ADJUDICATED_ANALYZERS,
  buildCase,
  flaggedCode,
  matchingRecords,
  nextCaseId,
} from './adjudication-case.mjs';
import { hashLines } from './false-positive-markers.mjs';

const finding = (overrides = {}) => ({
  end: 4,
  file: 'packages/a/src/a.ts',
  ruleNeedle: 'no-console',
  start: 2,
  whole: false,
  ...overrides,
});

describe('ADJUDICATED_ANALYZERS', () => {
  it('is the five analyzers that have an inline marker', () => {
    expect(ADJUDICATED_ANALYZERS).toEqual([
      'biome',
      'eslint',
      'fallow',
      'oxlint',
      'react-doctor',
    ]);
  });
});

describe('nextCaseId', () => {
  it('ignores a name that only contains a case id', () => {
    expect(
      nextCaseId(['notes-FP-0099.json', 'FP-0098.json.bak', 'FP-0003']),
    ).toBe('FP-0004');
  });
});

describe('matchingRecords — the shapes each analyzer prints', () => {
  it('finds an ESLint message under the file that names it', () => {
    const message = { line: 3, ruleId: 'no-console' };
    const report = [
      { filePath: '/repo/packages/b/src/b.ts', messages: [message] },
      { filePath: '/repo/packages/a/src/a.ts', messages: [message] },
    ];
    expect(matchingRecords({ finding: finding(), report })).toEqual([message]);
  });

  it('finds an Oxlint diagnostic whose line sits in a nested array', () => {
    const diagnostic = {
      code: 'eslint(no-console)',
      filename: 'packages/a/src/a.ts',
      labels: [{ span: { line: 2 } }],
    };
    expect(
      matchingRecords({
        finding: finding(),
        report: { diagnostics: [diagnostic], meta: null },
      }),
    ).toEqual([diagnostic]);
    expect(
      matchingRecords({
        finding: finding(),
        report: {
          diagnostics: [{ ...diagnostic, filename: 'packages/b/src/b.ts' }],
        },
      }),
    ).toEqual([]);
  });

  it('matches a rule spelled with underscores in a key', () => {
    const item = { line: 4, path: 'packages/a/src/a.ts' };
    expect(
      matchingRecords({
        finding: finding({ ruleNeedle: 'unused-export' }),
        report: { unused_exports: [item] },
      }),
    ).toEqual([item]);
  });

  it.each([
    ['a line before the range', 1],
    ['a line after the range', 5],
  ])('skips %s', (_label, line) => {
    expect(
      matchingRecords({
        finding: finding(),
        report: [
          {
            filePath: 'packages/a/src/a.ts',
            messages: [{ line, ruleId: 'no-console' }],
          },
        ],
      }),
    ).toEqual([]);
  });

  it.each([[2], [4]])('keeps a line on the edge of the range: %i', (line) => {
    expect(
      matchingRecords({
        finding: finding(),
        report: [
          {
            filePath: 'packages/a/src/a.ts',
            messages: [{ line, ruleId: 'no-console' }],
          },
        ],
      }),
    ).toHaveLength(1);
  });

  it('reads only numbers under a key naming a line', () => {
    expect(
      matchingRecords({
        finding: finding(),
        report: [
          {
            filePath: 'packages/a/src/a.ts',
            messages: [{ column: 3, line: 9, ruleId: 'no-console' }],
          },
        ],
      }),
    ).toEqual([]);
  });

  it('skips another rule on the same line', () => {
    expect(
      matchingRecords({
        finding: finding(),
        report: [
          {
            filePath: 'packages/a/src/a.ts',
            messages: [{ line: 3, ruleId: 'eqeqeq' }],
          },
        ],
      }),
    ).toEqual([]);
  });

  it('skips a nested array of arrays', () => {
    expect(
      matchingRecords({
        finding: finding(),
        report: {
          groups: [
            [{ line: 3, path: 'packages/a/src/a.ts', rule: 'no-console' }],
          ],
        },
      }),
    ).toEqual([]);
  });

  it('does not read the key path as the rule before any key is walked', () => {
    expect(
      matchingRecords({
        finding: finding({ ruleNeedle: 'fallow' }),
        report: { line: 3, path: 'packages/a/src/a.ts' },
      }),
    ).toEqual([]);
  });
});

describe('matchingRecords — whole records', () => {
  const group = {
    instances: [{ end_line: 9, file: 'packages/a/src/a.ts', start_line: 3 }],
  };

  it('returns the first array element on the path, not a plain object above it', () => {
    expect(
      matchingRecords({
        finding: finding({ ruleNeedle: '', whole: true }),
        report: { data: { groups: [group] } },
      }),
    ).toEqual([group]);
  });

  it('returns the element of a report that is itself an array', () => {
    const element = {
      filePath: 'packages/a/src/a.ts',
      messages: [{ line: 3 }],
    };
    expect(
      matchingRecords({
        finding: finding({ ruleNeedle: '', whole: true }),
        report: [element],
      }),
    ).toEqual([element]);
  });

  it('returns the match itself when no array holds it', () => {
    const report = { line: 3, path: 'packages/a/src/a.ts' };
    expect(
      matchingRecords({
        finding: finding({ ruleNeedle: '', whole: true }),
        report,
      }),
    ).toEqual([report]);
  });
});

describe('flaggedCode', () => {
  const text = Array.from(
    { length: 30 },
    (_, index) => `line ${index + 1}`,
  ).join('\n');

  it('hashes the flagged lines and numbers ten lines of context each side', () => {
    const code = flaggedCode({ end: 16, start: 15, text });
    expect(code).toMatchObject({
      content_hash: hashLines(['line 15', 'line 16']),
      context_end: 26,
      context_start: 5,
      end: 16,
      start: 15,
    });
    expect(code.context.split('\n')).toHaveLength(22);
    expect(code.context.split('\n')[0]).toBe('    5  line 5');
    expect(code.context.split('\n')[21]).toBe('   26  line 26');
  });

  it('clamps the context to the file', () => {
    expect(flaggedCode({ end: 2, start: 1, text })).toMatchObject({
      context_end: 12,
      context_start: 1,
    });
    expect(flaggedCode({ end: 30, start: 29, text })).toMatchObject({
      context_end: 30,
      context_start: 19,
    });
  });
});

describe('buildCase', () => {
  const args = {
    analyzer: 'eslint',
    caseId: 'FP-0001',
    code: { content_hash: 'h' },
    createdAt: '2026-10-30T10:00:00.000Z',
    finding: { file: 'a.ts' },
    findingId: 'a.ts:1:r',
    markerRule: 'r',
    pr: null,
    records: [],
    shas: { base: 'b', head: 'h' },
  };

  it('records a missing explanation and trace as null', () => {
    expect(buildCase(args)).toMatchObject({ explain: null, trace: null });
  });

  it('keeps an explanation and a trace it was given', () => {
    expect(buildCase({ ...args, explain: 'E', trace: 'T' })).toMatchObject({
      explain: 'E',
      trace: 'T',
    });
  });
});
