/*
 * The snapshot is the only reason the usage report survives transcript expiry,
 * so the property under test is the one that matters after the window rolls: a
 * day the transcripts no longer hold is still counted, and is still attributed
 * to the snapshot rather than to a source that could not have supplied it.
 *
 * The observed spans are the other half, and they exist because a recorded day
 * is not a covered day: a day with no invocation leaves no entry, so the days
 * the snapshot holds can never say how far back anything was actually read.
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import {
  countsFor,
  earliestDay,
  emptySnapshot,
  mergeObserved,
  mergeTally,
  observedBackTo,
  readSnapshot,
  writeSnapshot,
} from './usage-snapshot.mjs';

const WINDOW = { days: 30, end: '2026-09-04', start: '2026-08-06' };

const storedDays = {
  skills: { unslop: { '2026-08-10': 4, '2026-09-04': 1 } },
  subagents: { 'refactor-verifier': { '2026-08-10': 9 } },
};

describe('mergeObserved', () => {
  it('joins two runs that meet or overlap into one span', () => {
    expect(
      mergeObserved([{ from: '2026-08-06', to: '2026-09-04' }], {
        from: '2026-07-08',
        to: '2026-08-06',
      }),
    ).toEqual([{ from: '2026-07-08', to: '2026-09-04' }]);
  });

  it('joins two runs that leave no day between them', () => {
    expect(
      mergeObserved([{ from: '2026-08-06', to: '2026-09-04' }], {
        from: '2026-07-08',
        to: '2026-08-05',
      }),
    ).toEqual([{ from: '2026-07-08', to: '2026-09-04' }]);
  });

  it('keeps a gap between two runs as two spans', () => {
    expect(
      mergeObserved([{ from: '2026-05-04', to: '2026-06-02' }], {
        from: '2026-08-06',
        to: '2026-09-04',
      }),
    ).toEqual([
      { from: '2026-05-04', to: '2026-06-02' },
      { from: '2026-08-06', to: '2026-09-04' },
    ]);
  });

  it('records nothing for a run that observed nothing', () => {
    expect(
      mergeObserved([{ from: '2026-08-06', to: '2026-09-04' }], undefined),
    ).toEqual([{ from: '2026-08-06', to: '2026-09-04' }]);
  });
});

describe('observedBackTo', () => {
  it('reaches back only as far as the span covering the window end', () => {
    const observed = mergeObserved([{ from: '2026-05-04', to: '2026-06-02' }], {
      from: '2026-08-06',
      to: '2026-09-04',
    });

    expect(observedBackTo({ observed, to: '2026-09-04' })).toBe('2026-08-06');
  });

  it('reaches the whole way once the gap between runs is filled', () => {
    const observed = mergeObserved(
      mergeObserved([{ from: '2026-05-04', to: '2026-06-02' }], {
        from: '2026-08-06',
        to: '2026-09-04',
      }),
      { from: '2026-06-03', to: '2026-08-05' },
    );

    expect(observedBackTo({ observed, to: '2026-09-04' })).toBe('2026-05-04');
  });

  it('is undefined when no run reached the day asked about', () => {
    expect(
      observedBackTo({
        observed: [{ from: '2026-05-04', to: '2026-06-02' }],
        to: '2026-09-04',
      }),
    ).toBeUndefined();
  });
});

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

const snapshotPath = () =>
  join(mkdtempSync(join(tmpdir(), 'usage-')), 'snapshot.json');

const TIMESTAMP = '2026-09-04T10:00:00.000Z';

describe('readSnapshot', () => {
  it('starts empty rather than throwing on an unreadable file', () => {
    const path = snapshotPath();
    writeFileSync(path, 'not json');

    expect(readSnapshot({ path, timestamp: TIMESTAMP }).days).toEqual(
      emptySnapshot().days,
    );
  });

  it('round-trips what was written', () => {
    const path = snapshotPath();
    writeSnapshot({
      days: storedDays,
      observed: [{ from: '2026-08-06', to: '2026-09-04' }],
      path,
      updatedAt: '2026-09-04T00:00:00Z',
    });
    const read = readSnapshot({ path, timestamp: TIMESTAMP });

    expect(read.days).toEqual(storedDays);
    expect(read.observed).toEqual([{ from: '2026-08-06', to: '2026-09-04' }]);
  });

  it('reads a snapshot written before observed spans existed as having observed nothing', () => {
    const path = snapshotPath();
    writeFileSync(path, JSON.stringify({ days: storedDays, version: 1 }));

    expect(readSnapshot({ path, timestamp: TIMESTAMP }).observed).toEqual([]);
  });

  it('keeps an unreadable snapshot instead of letting the next write replace it', () => {
    const path = snapshotPath();
    writeFileSync(path, '{"version": 1, "days": {"skills": {"unslop"');

    const { setAside } = readSnapshot({ path, timestamp: TIMESTAMP });
    writeSnapshot({ days: {}, path, updatedAt: TIMESTAMP });

    expect(setAside.movedTo).toContain('.unreadable');
    expect(existsSync(setAside.movedTo)).toBe(true);
    expect(readFileSync(setAside.movedTo, 'utf8')).toContain('unslop');
  });

  it('keeps a snapshot written by a different version rather than overwriting it', () => {
    const path = snapshotPath();
    writeFileSync(path, JSON.stringify({ days: storedDays, version: 0 }));

    const { days, setAside } = readSnapshot({ path, timestamp: TIMESTAMP });

    expect(days).toEqual(emptySnapshot().days);
    expect(setAside.reason).toContain('version');
    expect(JSON.parse(readFileSync(setAside.movedTo, 'utf8')).days).toEqual(
      storedDays,
    );
  });

  it('reports nothing set aside when the file reads cleanly', () => {
    const path = snapshotPath();
    writeSnapshot({ days: storedDays, path, updatedAt: TIMESTAMP });

    expect(
      readSnapshot({ path, timestamp: TIMESTAMP }).setAside,
    ).toBeUndefined();
  });
});
