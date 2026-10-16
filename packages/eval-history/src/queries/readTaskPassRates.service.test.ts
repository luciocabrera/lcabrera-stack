import { describe, expect, it } from 'vite-plus/test';

import { readTaskPassRates } from './readTaskPassRates.service.ts';
import { recordingClient } from './recordingClient.util.ts';
import { taskPassRatesQuery } from './taskPassRatesQuery.util.ts';

const RUN_ID = '00000000-0000-4000-8000-000000000001';

const row = {
  k: 2,
  kind: 'trigger',
  modelId: 'model-a',
  n: 3,
  passAtK: true,
  passHatK: false,
  runId: RUN_ID,
  startedAt: new Date('2026-01-01T02:00:00Z'),
  suite: 'skills',
  taskHash: 'a'.repeat(64),
  taskKey: 'skills/react-19/trigger-1',
  taskSet: 'regression',
};

describe('readTaskPassRates', () => {
  it('sends the pass-rate query and returns the typed rows', async () => {
    const { client, sent } = recordingClient([row]);

    expect(await readTaskPassRates({ client, runId: RUN_ID })).toEqual([row]);
    expect(sent).toEqual([taskPassRatesQuery({ runId: RUN_ID })]);
  });

  it('rejects a row whose counts are not integers', async () => {
    const { client } = recordingClient([{ ...row, n: '3' }]);

    await expect(
      readTaskPassRates({ client, runId: RUN_ID }),
    ).rejects.toThrow();
  });
});
