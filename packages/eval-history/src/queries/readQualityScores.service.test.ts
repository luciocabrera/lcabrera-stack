import { describe, expect, it } from 'vite-plus/test';

import { readQualityScores } from './readQualityScores.service.ts';
import { schemaColumnsOf } from './schemaColumnsOf.util.ts';
import { scriptedClient } from './scriptedClient.util.ts';

const COLUMNS = schemaColumnsOf({
  eval_judge_score: ['dimension', 'score', 'trial_id'],
  eval_subject: ['id', 'kind', 'name'],
  eval_subject_version: ['id', 'subject_id'],
  eval_trial: ['id', 'run_id', 'subject_version_id'],
});

const ROW = {
  dimension: 'clarity',
  mean: 3.5,
  runId: '00000000-0000-4000-8000-000000000001',
  subjectKind: 'skill',
  subjectName: 'react-19',
  trials: 2,
};

describe('readQualityScores', () => {
  it('reads the mean score per dimension of the runs named', async () => {
    const accuracy = { ...ROW, dimension: 'accuracy', mean: 5, trials: 1 };
    const { client, sent } = scriptedClient({
      answer: () => [accuracy, ROW],
      columns: COLUMNS,
    });
    const read = await readQualityScores({ client, runIds: [ROW.runId] });

    expect(read.map(({ dimension, mean }) => [dimension, mean])).toEqual([
      ['accuracy', 5],
      ['clarity', 3.5],
    ]);
    expect(sent.at(-1)?.values).toEqual([[ROW.runId]]);
  });

  it('rejects a mean outside the rubric', async () => {
    const { client } = scriptedClient({
      answer: () => [{ ...ROW, mean: 6 }],
      columns: COLUMNS,
    });

    await expect(
      readQualityScores({ client, runIds: [ROW.runId] }),
    ).rejects.toThrow(
      expect.objectContaining({
        issues: [expect.objectContaining({ path: [0, 'mean'] })],
      }),
    );
  });
});
