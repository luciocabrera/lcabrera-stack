import { describe, expect, it } from 'vite-plus/test';

import type { IngestResult } from './ingest.types.ts';

import { unsentWarning } from './unsentWarning.util.ts';

const reportsOf = (results: readonly IngestResult[]) =>
  results.map((result) => ({
    durationMs: 0,
    file: `${result}.json`,
    problems: [],
    result,
    rows: { subjects: 0, tasks: 0, trials: 0 },
  }));

describe('unsentWarning', () => {
  it('counts the envelopes left on disk', () => {
    expect(
      unsentWarning({
        database: 'localhost:5432/evals',
        reports: reportsOf(['unsent', 'inserted', 'unsent']),
      }),
    ).toEqual([
      'evals:ingest: localhost:5432/evals is unreachable; 2 envelope(s) stay on disk until `vp run evals:ingest` sends them',
    ]);
  });

  it('says nothing when every envelope was sent', () => {
    expect(
      unsentWarning({
        database: 'localhost:5432/evals',
        reports: reportsOf(['inserted', 'present']),
      }),
    ).toEqual([]);
  });
});
