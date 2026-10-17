import { describe, expect, it } from 'vite-plus/test';

import { readRunCosts } from './readRunCosts.service.ts';
import { schemaColumnsOf } from './schemaColumnsOf.util.ts';
import { scriptedClient } from './scriptedClient.util.ts';

const COLUMNS = schemaColumnsOf({
  eval_run: ['model_id', 'run_id', 'started_at', 'suite'],
  eval_subject: ['id', 'kind', 'name'],
  eval_subject_version: ['id', 'subject_id'],
  eval_trial: [
    'cost_usd_reported',
    'duration_ms',
    'id',
    'run_id',
    'subject_version_id',
    'tokens_cache_read',
    'tokens_cache_write',
    'tokens_in',
    'tokens_out',
  ],
  model_price: [
    'model_id',
    'usd_per_mtok_cache_read',
    'usd_per_mtok_cache_write',
    'usd_per_mtok_in',
    'usd_per_mtok_out',
    'valid_from',
  ],
});

const figures = {
  computedTrials: 3,
  computedUsd: 0.4,
  costliestTrialId: '9',
  p50Ms: 1200,
  p95Ms: 4000,
  reportedTrials: 3,
  reportedUsd: 0.42,
  slowestTrialId: '8',
  tokensCacheRead: 0,
  tokensCacheWrite: 0,
  tokensIn: 3000,
  tokensOut: 600,
  trials: 3,
};

const RUN = {
  ...figures,
  modelId: 'model-a',
  runId: '00000000-0000-4000-8000-000000000001',
  startedAt: new Date('2026-01-01T02:00:00Z'),
  suite: 'skills',
};

const SUBJECT = { ...figures, subjectKind: 'skill', subjectName: 'react-19' };

const SUITE = { ...figures, suite: 'skills' };

const answerFor = (text: string) => {
  if (text.includes('group by priced.run_id')) {
    return [RUN];
  }

  return [text.includes('group by subject.') ? SUBJECT : SUITE];
};

describe('readRunCosts', () => {
  it('reads the costs per run, per subject and per suite', async () => {
    const { client, sent } = scriptedClient({
      answer: ({ text }) => answerFor(text),
      columns: COLUMNS,
    });

    expect(await readRunCosts({ client, perSuite: 30 })).toEqual({
      runs: [RUN],
      subjects: [SUBJECT],
      suites: [SUITE],
    });
    expect(sent.map(({ values }) => values)).toEqual([[], [30], [30], [30]]);
  });

  it('rejects a run from an unknown suite', async () => {
    const { client } = scriptedClient({
      answer: ({ text }) =>
        answerFor(text).map((row) => ({ ...row, suite: 'other' })),
      columns: COLUMNS,
    });

    await expect(readRunCosts({ client, perSuite: 30 })).rejects.toThrow();
  });
});
