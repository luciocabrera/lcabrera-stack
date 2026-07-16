/* eslint-disable unicorn/no-null -- fixtures mirror ProjectScannerTrendRow's real Postgres-nullable columns */
import { describe, expect, it } from 'vitest';

import { groupTrendByScanner } from './groupTrendByScanner.util';

describe('groupTrendByScanner', () => {
  it('groups rows by scanner_id, preserving chronological order', () => {
    const groups = groupTrendByScanner([
      {
        created_at: '2026-01-01',
        high_count: 3,
        high_count_delta: null,
        medium_count: 1,
        medium_count_delta: null,
        run_id: 'r1',
        scanner_id: 'linter',
      },
      {
        created_at: '2026-01-02',
        high_count: 1,
        high_count_delta: -2,
        medium_count: 2,
        medium_count_delta: 1,
        run_id: 'r2',
        scanner_id: 'linter',
      },
      {
        created_at: '2026-01-01',
        high_count: 5,
        high_count_delta: null,
        medium_count: 0,
        medium_count_delta: null,
        run_id: 'r1',
        scanner_id: 'code-smell-checker',
      },
    ]);

    expect(groups).toEqual([
      { highCounts: [3, 1], scannerId: 'linter' },
      { highCounts: [5], scannerId: 'code-smell-checker' },
    ]);
  });

  it('defaults a null high_count to 0', () => {
    const groups = groupTrendByScanner([
      {
        created_at: '2026-01-01',
        high_count: null,
        high_count_delta: null,
        medium_count: null,
        medium_count_delta: null,
        run_id: 'r1',
        scanner_id: 'linter',
      },
    ]);

    expect(groups).toEqual([{ highCounts: [0], scannerId: 'linter' }]);
  });

  it('returns an empty array for no rows', () => {
    expect(groupTrendByScanner([])).toEqual([]);
  });
});
