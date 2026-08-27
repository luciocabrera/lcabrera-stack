/**
 * The direction of the contract is the only thing worth testing here: the
 * baseline shrinks and does not grow. Each case is a way it could grow by
 * accident — a malformed file read as "grandfather everything", an entry naming
 * nothing, an entry nobody adopted, and a prune that ratchets the bound the
 * wrong way.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  EMPTY_BASELINE,
  adoptedBaseline,
  baselineFindings,
  baselinedFiles,
  hasGrown,
  prunedBaseline,
  readableBaseline,
} from './adr-baseline.mjs';

const record = (number, findings = []) => ({
  filename: `ADR-${String(number).padStart(3, '0')}-a.md`,
  findings,
  number,
});

const failing = (number) => record(number, ['no metadata block']);

describe('readableBaseline', () => {
  it('reads a malformed file as grandfathering nothing', () => {
    // The dangerous direction: a broken baseline that read as "everything is
    // exempt" would turn the gate off while still exiting 0.
    for (const parsed of [undefined, null, [], 'text', { files: 'all' }]) {
      expect(readableBaseline(parsed)).toEqual(EMPTY_BASELINE);
    }
  });

  it('drops a non-string entry rather than carrying it', () => {
    expect(readableBaseline({ files: ['a.md', 7], maxEntries: 2 })).toEqual({
      files: ['a.md'],
      maxEntries: 2,
    });
  });

  it('reads an unusable bound as zero, which reports as growth', () => {
    // Not as "no bound set": a baseline whose bound cannot be read must not be
    // the one state that grandfathers freely.
    for (const maxEntries of [undefined, -1, 'many', 1.5]) {
      expect(hasGrown(readableBaseline({ files: ['a.md'], maxEntries }))).toBe(
        true,
      );
    }
  });
});

describe('baselineFindings', () => {
  const baseline = { files: ['ADR-001-a.md'], maxEntries: 1 };

  it('says nothing about an entry that still earns its place', () => {
    expect(baselineFindings({ baseline, records: [failing(1)] })).toEqual([]);
  });

  it('reports an entry naming no record', () => {
    expect(baselineFindings({ baseline, records: [] })).toEqual([
      expect.stringContaining('names no ADR'),
    ]);
  });

  it('reports an entry whose record now passes', () => {
    expect(baselineFindings({ baseline, records: [record(1)] })).toEqual([
      expect.stringContaining('now satisfies the content rules'),
    ]);
  });

  it('reports a list longer than its bound, whatever the numbers are', () => {
    // The door a number window left open: a record taking a RETIRED number sits
    // inside any window, so numbering cannot be what decides this.
    expect(
      baselineFindings({
        baseline: { files: ['ADR-001-a.md', 'ADR-002-a.md'], maxEntries: 1 },
        records: [failing(1), failing(2)],
      })[0],
    ).toContain('has grown');
  });
});

describe('prunedBaseline', () => {
  it('keeps only the entries still failing, and lowers the bound to match', () => {
    expect(
      prunedBaseline({
        baseline: {
          files: ['ADR-003-a.md', 'ADR-002-a.md', 'ADR-001-a.md'],
          maxEntries: 3,
        },
        records: [failing(1), record(2), failing(3)],
      }),
    ).toEqual({ files: ['ADR-001-a.md', 'ADR-003-a.md'], maxEntries: 2 });
  });

  it('never raises the bound above what it kept', () => {
    // Guards the laundering path: pruning a grown list must not write the grown
    // length back as the new bound. The caller refuses first; this is the second
    // half of that, so the two cannot disagree.
    const pruned = prunedBaseline({
      baseline: { files: ['ADR-001-a.md', 'ADR-002-a.md'], maxEntries: 1 },
      records: [failing(1), failing(2)],
    });

    expect(pruned.maxEntries).toBe(pruned.files.length);
  });
});

describe('adoptedBaseline', () => {
  it('bounds the baseline at exactly what it grandfathered', () => {
    const adopted = adoptedBaseline([failing(1), record(2), failing(3)]);

    expect(adopted).toEqual({
      files: ['ADR-001-a.md', 'ADR-003-a.md'],
      maxEntries: 2,
    });
    expect(baselinedFiles(adopted).has('ADR-002-a.md')).toBe(false);
    expect(hasGrown(adopted)).toBe(false);
  });
});
