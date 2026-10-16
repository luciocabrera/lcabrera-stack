import { describe, expect, it } from 'vite-plus/test';

import { flakyTasksQuery } from './flakyTasksQuery.util.ts';
import { readFlakyTasks } from './readFlakyTasks.service.ts';
import { recordingClient } from './recordingClient.util.ts';

const row = {
  disagreeFraction: 0.4,
  disagreeing: 4,
  runs: 10,
  suite: 'skills',
  taskKey: 'skills/react-19/trigger-1',
};

describe('readFlakyTasks', () => {
  const args = { disagreeFraction: 0.2, window: 10 };

  it('sends the flaky-task query and returns the typed rows', async () => {
    const { client, sent } = recordingClient([row]);

    expect(await readFlakyTasks({ client, ...args })).toEqual([row]);
    expect(sent).toEqual([flakyTasksQuery(args)]);
  });

  it('rejects a row without a task key', async () => {
    const { client } = recordingClient([{ ...row, taskKey: 7 }]);

    await expect(readFlakyTasks({ client, ...args })).rejects.toThrow();
  });
});
