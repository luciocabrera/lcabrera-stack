import { describe, expect, it } from 'vite-plus/test';

import { runGate } from './fallow-gate-command.mjs';
import { fakeEffects, json } from './fallow-gate-fixtures.mjs';

const adjudicatedReport = (reason) =>
  json({
    files: [
      {
        path: 'a.ts',
        suppressions: [{ kind: 'complexity', line: 4, reason }],
      },
    ],
  });

const ENTRY = {
  analyzer: 'fallow',
  case: 'FP-0007',
  expires: '2027-01-01',
  file: 'a.ts',
  rule: 'complexity',
};

const REASON = 'false positive, case FP-0007: the branches are a fixed table';

describe('runGate — a suppression a false-positive panel confirmed', () => {
  it('passes a marker whose case is a live entry for the same file and kind', () => {
    const fake = fakeEffects({
      falsePositives: [ENTRY],
      replies: [adjudicatedReport(REASON)],
      stdinFiles: ['a.ts'],
    });
    expect(runGate({ argv: ['suppressions'], effects: fake.effects })).toBe(0);
  });

  it.each([
    ['no entry names the case', [], REASON],
    ['the entry expired', [{ ...ENTRY, expires: '2026-10-29' }], REASON],
    [
      'the entry is for another kind',
      [{ ...ENTRY, rule: 'unused-export' }],
      REASON,
    ],
    ['the entry is for another file', [{ ...ENTRY, file: 'b.ts' }], REASON],
    [
      'the entry is for another analyzer',
      [{ ...ENTRY, analyzer: 'eslint' }],
      REASON,
    ],
    ['the marker gives no reason', [ENTRY], 'false positive, case FP-0007:'],
    ['the marker names no case', [ENTRY], 'false positive: fixed table'],
  ])('still fails the marker when %s', (_label, falsePositives, reason) => {
    const fake = fakeEffects({
      falsePositives,
      replies: [adjudicatedReport(reason)],
      stdinFiles: ['a.ts'],
    });
    expect(runGate({ argv: ['suppressions'], effects: fake.effects })).toBe(1);
  });
});
