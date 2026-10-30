import { describe, expect, it } from 'vite-plus/test';

import { ingestLogLine } from './ingestLogLine.util.ts';

describe('ingestLogLine', () => {
  it('writes one JSON object naming the run, its rows and its duration', () => {
    const line = ingestLogLine({
      database: 'localhost:5432/eval_history',
      report: {
        durationMs: 12,
        file: 'run.json',
        problems: [],
        result: 'inserted',
        rows: { subjects: 1, tasks: 2, trials: 6 },
        runId: '4e5aa14f-79b7-452d-be7c-66bdff258a25',
        suite: 'skills',
      },
    });

    expect(JSON.parse(line) as unknown).toEqual({
      database: 'localhost:5432/eval_history',
      duration_ms: 12,
      event: 'evals.ingest',
      file: 'run.json',
      problems: [],
      result: 'inserted',
      rows: { subjects: 1, tasks: 2, trials: 6 },
      run_id: '4e5aa14f-79b7-452d-be7c-66bdff258a25',
      suite: 'skills',
    });
  });

  it('names the case, and its case and verdict rows, for an adjudication', () => {
    const line = ingestLogLine({
      database: 'localhost:5432/eval_history',
      report: {
        caseId: 'FP-0001',
        durationMs: 3,
        file: 'FP-0001.json',
        problems: [],
        result: 'inserted',
        rows: { cases: 1, verdicts: 3 },
      },
    });

    expect(JSON.parse(line) as unknown).toEqual({
      case_id: 'FP-0001',
      database: 'localhost:5432/eval_history',
      duration_ms: 3,
      event: 'evals.ingest',
      file: 'FP-0001.json',
      problems: [],
      result: 'inserted',
      rows: { cases: 1, verdicts: 3 },
    });
  });
});
