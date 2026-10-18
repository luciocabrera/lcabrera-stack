import { describe, expect, it } from 'vite-plus/test';

import { readRunJudgeScores } from './readRunJudgeScores.service.ts';
import { scriptedClient } from './scriptedClient.util.ts';

const COLUMNS = [
  'eval_judge_score.dimension',
  'eval_judge_score.score',
  'eval_judge_score.trial_id',
  'eval_trial.id',
  'eval_trial.run_id',
].map((qualified) => {
  const [table = '', column = ''] = qualified.split('.', 2);

  return { column, dataType: 'integer', table, udtName: 'int4' };
});

const RUN_ID = '6f1d4c4e-8a4f-4b8c-9a0e-0c1f2d3e4f50';

const score = { dimension: 'clarity', score: 4, trialId: '41' };

describe('readRunJudgeScores', () => {
  it('returns every judge score of the run', async () => {
    const { client, sent } = scriptedClient({
      answer: () => [score],
      columns: COLUMNS,
    });

    expect(await readRunJudgeScores({ client, runId: RUN_ID })).toEqual([
      score,
    ]);
    expect(sent.at(-1)?.values).toEqual([RUN_ID]);
  });

  it('rejects a score outside the rubric range', async () => {
    const { client } = scriptedClient({
      answer: () => [{ ...score, score: 9 }],
      columns: COLUMNS,
    });

    await expect(
      readRunJudgeScores({ client, runId: RUN_ID }),
    ).rejects.toThrow();
  });
});
