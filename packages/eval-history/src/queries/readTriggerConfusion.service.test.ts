import { describe, expect, it } from 'vite-plus/test';

import { readTriggerConfusion } from './readTriggerConfusion.service.ts';
import { schemaColumnsOf } from './schemaColumnsOf.util.ts';
import { scriptedClient } from './scriptedClient.util.ts';

const COLUMNS = schemaColumnsOf({
  eval_task: ['id', 'kind'],
  eval_task_version: ['id', 'task_id'],
  eval_trial: ['id', 'outcome', 'run_id', 'task_version_id'],
  eval_trial_detail: ['trial_id'],
});

const ROW = {
  errored: false,
  expectedSkill: 'react-19',
  invoked: ['react-19', 'store-pattern'],
  taskKind: 'trigger',
  trials: 2,
};

const RUN = '00000000-0000-4000-8000-000000000001';

describe('readTriggerConfusion', () => {
  it('reads the counted expectations of the runs named', async () => {
    const { client, sent } = scriptedClient({
      answer: () => [ROW],
      columns: COLUMNS,
    });

    expect(await readTriggerConfusion({ client, runIds: [RUN] })).toEqual([
      ROW,
    ]);
    expect(sent.at(-1)?.values).toEqual([[RUN]]);
  });

  it('rejects a task kind outside the trigger suite', async () => {
    const { client } = scriptedClient({
      answer: () => [{ ...ROW, taskKind: 'fixture' }],
      columns: COLUMNS,
    });

    await expect(
      readTriggerConfusion({ client, runIds: [RUN] }),
    ).rejects.toThrow();
  });
});
