/*
 * The snapshot is the only reason the usage report survives transcript expiry,
 * so the property under test is the one that matters after the window rolls: a
 * day the transcripts no longer hold is still counted, and is still attributed
 * to the snapshot rather than to a source that could not have supplied it.
 */
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import {
  countsFor,
  earliestDay,
  emptySnapshot,
  mergeTally,
  readSnapshot,
  writeSnapshot,
} from './usage-snapshot.mjs';

const WINDOW = { days: 30, end: '2026-09-04', start: '2026-08-06' };

const storedDays = {
  skills: { unslop: { '2026-08-10': 4, '2026-09-04': 1 } },
  subagents: { 'refactor-verifier': { '2026-08-10': 9 } },
};

describe('mergeTally', () => {
  it('keeps a day the live transcripts no longer hold', () => {
    const merged = mergeTally(storedDays, {
      skills: { unslop: { '2026-09-04': 1 } },
    });

    expect(merged.skills.unslop['2026-08-10']).toBe(4);
    expect(merged.subagents['refactor-verifier']['2026-08-10']).toBe(9);
  });

  it('never lowers a day already recorded', () => {
    const merged = mergeTally(storedDays, {
      skills: { unslop: { '2026-08-10': 1 } },
    });

    expect(merged.skills.unslop['2026-08-10']).toBe(4);
  });

  it('raises a day when a live read sees more than was recorded', () => {
    const merged = mergeTally(storedDays, {
      skills: { unslop: { '2026-08-10': 7 } },
    });

    expect(merged.skills.unslop['2026-08-10']).toBe(7);
  });

  it('adds a name that was never in the snapshot', () => {
    const merged = mergeTally(storedDays, {
      subagents: { 'refactor-builder': { '2026-09-04': 2 } },
    });

    expect(merged.subagents['refactor-builder']['2026-09-04']).toBe(2);
  });
});

describe('countsFor', () => {
  it('attributes a day the transcripts no longer hold to the snapshot', () => {
    const merged = mergeTally(storedDays, {
      skills: { unslop: { '2026-09-04': 1 } },
    });

    expect(
      countsFor({
        live: { unslop: { '2026-09-04': 1 } },
        merged: merged.skills,
        name: 'unslop',
        window: WINDOW,
      }),
    ).toEqual({ carriedFromSnapshot: 4, fromTranscripts: 1, total: 5 });
  });

  it('counts nothing outside the window', () => {
    expect(
      countsFor({
        live: {},
        merged: { unslop: { '2026-01-01': 12 } },
        name: 'unslop',
        window: WINDOW,
      }),
    ).toEqual({ carriedFromSnapshot: 0, fromTranscripts: 0, total: 0 });
  });

  it('reports zero for a name nothing has ever recorded', () => {
    expect(
      countsFor({
        live: {},
        merged: {},
        name: 'store-pattern',
        window: WINDOW,
      }),
    ).toEqual({ carriedFromSnapshot: 0, fromTranscripts: 0, total: 0 });
  });
});

describe('earliestDay', () => {
  it('is the oldest day any name was recorded on', () => {
    expect(earliestDay(storedDays)).toBe('2026-08-10');
  });

  it('is undefined while the snapshot is empty', () => {
    expect(earliestDay(emptySnapshot().days)).toBeUndefined();
  });
});

describe('readSnapshot', () => {
  it('starts empty rather than throwing on an unreadable file', () => {
    const path = join(mkdtempSync(join(tmpdir(), 'usage-')), 'snapshot.json');
    writeFileSync(path, 'not json');

    expect(readSnapshot(path)).toEqual(emptySnapshot());
  });

  it('round-trips what was written', () => {
    const path = join(mkdtempSync(join(tmpdir(), 'usage-')), 'snapshot.json');
    writeSnapshot({
      days: storedDays,
      path,
      updatedAt: '2026-09-04T00:00:00Z',
    });

    expect(readSnapshot(path).days).toEqual(storedDays);
  });
});
