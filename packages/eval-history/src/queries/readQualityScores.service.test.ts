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
    const { client, sent } = scriptedClient({
      answer: () => [ROW],
      columns: COLUMNS,
    });

    expect(await readQualityScores({ client, runIds: [ROW.runId] })).toEqual([
      ROW,
    ]);
    expect(sent.at(-1)?.values).toEqual([[ROW.runId]]);
  });

  it('asks nothing for no runs', async () => {
    const { client, sent } = scriptedClient({ answer: () => [], columns: [] });

    expect(await readQualityScores({ client, runIds: [] })).toEqual([]);
    expect(sent).toEqual([]);
  });

  it('rejects a mean outside the rubric', async () => {
    const { client } = scriptedClient({
      answer: () => [{ ...ROW, mean: 6 }],
      columns: COLUMNS,
    });

    await expect(
      readQualityScores({ client, runIds: [ROW.runId] }),
    ).rejects.toThrow();
  });
});
