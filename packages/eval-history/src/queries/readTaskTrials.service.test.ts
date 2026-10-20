import { describe, expect, it } from 'vite-plus/test';

import { readTaskTrials } from './readTaskTrials.service.ts';
import { schemaColumnsOf } from './schemaColumnsOf.util.ts';
import { scriptedClient } from './scriptedClient.util.ts';

const COLUMNS = schemaColumnsOf({
  eval_task: ['id', 'suite', 'task_key', 'task_set'],
  eval_task_version: ['id', 'task_id'],
  eval_trial: ['id', 'outcome', 'run_id', 'task_version_id', 'trial_index'],
});

const ROW = {
  outcomes: ['pass', 'fail', 'error'],
  runId: '00000000-0000-4000-8000-000000000001',
  suite: 'skills',
  taskKey: 'skills/react-19/trigger-1',
  taskSet: 'regression',
};

describe('readTaskTrials', () => {
  it("reads each task's outcomes for the runs named", async () => {
    const { client, sent } = scriptedClient({
      answer: () => [ROW],
      columns: COLUMNS,
    });

    expect(await readTaskTrials({ client, runIds: [ROW.runId] })).toEqual([
      ROW,
    ]);
    expect(sent.at(-1)?.values).toEqual([[ROW.runId]]);
  });

  it('rejects an outcome the envelope does not know', async () => {
    const { client } = scriptedClient({
      answer: () => [{ ...ROW, outcomes: ['maybe'] }],
      columns: COLUMNS,
    });

    await expect(
      readTaskTrials({ client, runIds: [ROW.runId] }),
    ).rejects.toThrow(
      expect.objectContaining({
        issues: [expect.objectContaining({ path: [0, 'outcomes', 0] })],
      }),
    );
  });
});
