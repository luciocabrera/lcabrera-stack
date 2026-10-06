import { describe, expect, it } from 'vite-plus/test';

import type { IngestReport, IngestResult } from './ingest.types.ts';

import { ingestSummary } from './ingestSummary.util.ts';

const report = (result: IngestResult): IngestReport => ({
  durationMs: 12,
  file: `.tmp/eval-results/skills/${result}.json`,
  problems: [],
  result,
  rows:
    result === 'inserted'
      ? { subjects: 1, tasks: 2, trials: 6 }
      : { subjects: 0, tasks: 0, trials: 0 },
  runId: '4e5aa14f-79b7-452d-be7c-66bdff258a25',
  suite: 'skills',
});

type SummarizeArgs = {
  readonly isQuiet?: boolean;
  readonly results: readonly IngestResult[];
};

const summarize = ({ isQuiet = false, results }: SummarizeArgs) =>
  ingestSummary({
    database: 'localhost:5432/eval_history',
    missing: [],
    quietUnreachable: isQuiet,
    reports: results.map((result) => report(result)),
  });

describe('ingestSummary', () => {
  it('prints one structured line per run', () => {
    const { stdout } = summarize({ results: ['inserted'] });

    expect(stdout.map((line) => JSON.parse(line) as unknown)).toEqual([
      {
        database: 'localhost:5432/eval_history',
        duration_ms: 12,
        event: 'evals.ingest',
        file: '.tmp/eval-results/skills/inserted.json',
        problems: [],
        result: 'inserted',
        rows: { subjects: 1, tasks: 2, trials: 6 },
        run_id: '4e5aa14f-79b7-452d-be7c-66bdff258a25',
        suite: 'skills',
      },
    ]);
  });

  it('exits 0 when every run is stored or already present', () => {
    expect(summarize({ results: ['inserted', 'present'] }).exitCode).toBe(0);
  });

  it.each(['conflict', 'failed', 'rejected'] as const)(
    'exits 1 on a %s run, even when quiet',
    (result) => {
      expect(
        summarize({ isQuiet: true, results: ['inserted', result] }).exitCode,
      ).toBe(1);
    },
  );

  it('fails on an unreachable database unless told to stay quiet', () => {
    expect(summarize({ results: ['unsent'] }).exitCode).toBe(1);
    expect(summarize({ isQuiet: true, results: ['unsent'] })).toMatchObject({
      exitCode: 0,
      stderr: [
        'evals:ingest: localhost:5432/eval_history is unreachable; 1 envelope(s) stay on disk until `vp run evals:ingest` sends them',
      ],
    });
  });

  it('fails on a path that does not exist', () => {
    expect(
      ingestSummary({
        database: 'localhost:5432/eval_history',
        missing: ['nope'],
        quietUnreachable: true,
        reports: [],
      }),
    ).toEqual({
      exitCode: 1,
      stderr: ['evals:ingest: no such file or directory: nope'],
      stdout: [],
    });
  });

  it('says so when there is nothing to ingest', () => {
    expect(summarize({ results: [] })).toEqual({
      exitCode: 0,
      stderr: ['evals:ingest: no envelopes found'],
      stdout: [],
    });
  });
});
