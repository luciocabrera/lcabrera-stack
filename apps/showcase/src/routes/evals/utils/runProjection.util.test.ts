import type {
  RunSummary,
  RunTrial,
} from '@repo/eval-history/queries/queries.types';

import { describe, expect, it } from 'vite-plus/test';

import { runProjection } from './runProjection.util';

const RUN_ID = '6f1d4c4e-8a4f-4b8c-9a0e-0c1f2d3e4f50';

const run = {
  branch: 'main',
  finishedAt: new Date('2026-10-01T02:40:00.000Z'),
  gitSha: 'a'.repeat(40),
  modelId: 'claude-test',
  runId: RUN_ID,
  startedAt: new Date('2026-10-01T02:00:00.000Z'),
  status: 'complete',
  suite: 'skill-quality',
  trials: 2,
  trigger: 'manual',
} as RunSummary;

const judged = {
  outcome: 'pass',
  overall: 3.5,
  subjectKind: 'skill',
  subjectName: 'unslop',
  taskKey: 'skill-quality/unslop',
  taskKind: 'quality',
  trialId: '7',
  trialIndex: 0,
} as RunTrial;

const failed = {
  errorClass: 'unparsed_reply',
  outcome: 'error',
  subjectKind: 'skill',
  subjectName: 'epic',
  taskKey: 'skill-quality/epic',
  taskKind: 'quality',
  trialId: '8',
  trialIndex: 0,
} as RunTrial;

describe('runProjection', () => {
  const projection = runProjection({
    run,
    scores: [
      { dimension: 'clarity', score: 4, trialId: '7' },
      { dimension: 'completeness', score: 3, trialId: '7' },
    ],
    trials: [judged, failed],
  });

  it('names the run with the envelope fields the projection allows', () => {
    expect(projection.run).toEqual({
      branch: 'main',
      finished_at: '2026-10-01T02:40:00.000Z',
      git_sha: 'a'.repeat(40),
      model_id: 'claude-test',
      run_id: RUN_ID,
      started_at: '2026-10-01T02:00:00.000Z',
      status: 'complete',
      suite: 'skill-quality',
      trigger: 'manual',
    });
  });

  it('lists each task once with its subject', () => {
    expect(projection.tasks).toEqual([
      {
        kind: 'quality',
        subject: { kind: 'skill', name: 'unslop' },
        task_key: 'skill-quality/unslop',
      },
      {
        kind: 'quality',
        subject: { kind: 'skill', name: 'epic' },
        task_key: 'skill-quality/epic',
      },
    ]);
  });

  it('gives each trial its own judge scores and nothing of another', () => {
    expect(projection.trials.map(({ detail }) => detail.dimensions)).toEqual([
      [
        { name: 'clarity', score: 4 },
        { name: 'completeness', score: 3 },
      ],
      [],
    ]);
    expect(projection.trials[0]?.detail.overall).toBe(3.5);
    expect(projection.trials[1]).toMatchObject({
      error_class: 'unparsed_reply',
      outcome: 'error',
    });
  });

  it('leaves out a model the run did not record', () => {
    expect(
      runProjection({
        run: { ...run, modelId: undefined },
        scores: [],
        trials: [],
      }).run.model_id,
    ).toBeUndefined();
  });
});
