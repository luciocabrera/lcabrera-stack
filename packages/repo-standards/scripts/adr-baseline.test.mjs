/**
 * The direction of the contract is the only thing worth testing here: the
 * baseline shrinks and does not grow. Each case is a way it could grow by
 * accident — a malformed file read as "grandfather everything", an entry naming
 * nothing, an entry for a record written after the window closed.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  EMPTY_BASELINE,
  adoptedBaseline,
  baselineFindings,
  baselinedFiles,
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
    expect(readableBaseline({ closedAt: 2, files: ['a.md', 7] })).toEqual({
      closedAt: 2,
      files: ['a.md'],
    });
  });
});

describe('baselineFindings', () => {
  const baseline = { closedAt: 2, files: ['ADR-001-a.md'] };

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

  it('reports an entry above the window, which is how it would grow', () => {
    expect(
      baselineFindings({
        baseline: { closedAt: 0, files: ['ADR-001-a.md'] },
        records: [failing(1)],
      }),
    ).toEqual([expect.stringContaining("above the baseline's closedAt")]);
  });
});

describe('prunedBaseline', () => {
  it('keeps only the entries still inside the window and still failing', () => {
    expect(
      prunedBaseline({
        baseline: {
          closedAt: 2,
          files: ['ADR-003-a.md', 'ADR-002-a.md', 'ADR-001-a.md'],
        },
        records: [failing(1), record(2), failing(3)],
      }),
    ).toEqual({ closedAt: 2, files: ['ADR-001-a.md'] });
  });
});

describe('adoptedBaseline', () => {
  it('closes the window at the highest record present', () => {
    const adopted = adoptedBaseline([failing(1), record(2), failing(3)]);

    expect(adopted).toEqual({
      closedAt: 3,
      files: ['ADR-001-a.md', 'ADR-003-a.md'],
    });
    expect(baselinedFiles(adopted).has('ADR-002-a.md')).toBe(false);
  });
});
