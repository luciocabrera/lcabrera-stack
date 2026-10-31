import { describe, expect, it } from 'vite-plus/test';

import { runGate } from './fallow-gate-command.mjs';

const json = (value) => ({ status: 0, stdout: JSON.stringify(value) });

const fakeEffects = ({ falsePositives, replies }) => {
  const queue = [...replies];
  return {
    effects: {
      exists: () => true,
      readFalsePositives: () => falsePositives,
      readStdinFiles: () => [],
      root: '/repo',
      spawn: () => queue.shift(),
      today: () => '2026-10-30',
      write: () => undefined,
      writeError: () => undefined,
    },
  };
};

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

const gate = ({ falsePositives, reason }) =>
  runGate({
    argv: ['suppressions', 'a.ts'],
    effects: fakeEffects({
      falsePositives,
      replies: [adjudicatedReport(reason)],
    }).effects,
  });

describe('runGate — a suppression a false-positive panel confirmed', () => {
  it.each([
    ['a live entry', ENTRY],
    ['an entry on its last day', { ...ENTRY, expires: '2026-10-30' }],
  ])(
    'passes a marker whose case is %s for the same file and kind',
    (_label, entry) => {
      expect(gate({ falsePositives: [entry], reason: REASON })).toBe(0);
    },
  );

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
    ['the claim is not at the start of the reason', [ENTRY], `see ${REASON}`],
    [
      'neither the marker nor the entry names a case',
      [{ ...ENTRY, case: undefined }],
      'false positive: fixed table',
    ],
    ['the marker has no reason at all', [ENTRY], undefined],
    [
      'the expiry is not a date string',
      [{ ...ENTRY, expires: 20_270_101 }],
      REASON,
    ],
  ])('still fails the marker when %s', (_label, falsePositives, reason) => {
    expect(gate({ falsePositives, reason })).toBe(1);
  });
});
