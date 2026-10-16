import { describe, expect, it } from 'vite-plus/test';

import { readSubjectRuns } from './readSubjectRuns.service.ts';
import { schemaColumnsOf } from './schemaColumnsOf.util.ts';
import { scriptedClient } from './scriptedClient.util.ts';

const COLUMNS = schemaColumnsOf({
  eval_run: ['model_id', 'run_id', 'started_at', 'suite'],
  eval_subject: ['id', 'kind', 'name'],
  eval_subject_version: ['content_hash', 'id', 'subject_id'],
  eval_task: ['id', 'task_key'],
  eval_task_version: ['id', 'task_id'],
  eval_trial: [
    'id',
    'outcome',
    'run_id',
    'subject_version_id',
    'task_version_id',
  ],
});

const row = {
  contentHash: 'c'.repeat(64),
  k: 2,
  modelId: 'model-a',
  n: 3,
  runId: '00000000-0000-4000-8000-000000000001',
  startedAt: new Date('2026-01-01T02:00:00Z'),
  subjectKind: 'skill',
  subjectName: 'react-19',
  suite: 'skills',
  taskKeys: ['skills/react-19/trigger-1'],
  trialId: '41',
  trials: 3,
};

describe('readSubjectRuns', () => {
  it('derives the public columns first, then reads the subject runs', async () => {
    const { client, sent } = scriptedClient({
      answer: () => [row],
      columns: COLUMNS,
    });

    expect(
      await readSubjectRuns({
        client,
        scope: { kind: 'recent', perSuite: 10 },
      }),
    ).toEqual([row]);
    expect(sent.map(({ values }) => values)).toEqual([[], [10]]);
  });

  it('rejects a row whose trial id is not a number', async () => {
    const { client } = scriptedClient({
      answer: () => [{ ...row, trialId: 'x' }],
      columns: COLUMNS,
    });

    await expect(
      readSubjectRuns({ client, scope: { kind: 'recent', perSuite: 10 } }),
    ).rejects.toThrow();
  });
});
