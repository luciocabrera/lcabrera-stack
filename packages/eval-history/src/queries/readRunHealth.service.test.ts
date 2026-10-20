import { describe, expect, it } from 'vite-plus/test';

import { readRunHealth } from './readRunHealth.service.ts';
import { schemaColumnsOf } from './schemaColumnsOf.util.ts';
import { scriptedClient } from './scriptedClient.util.ts';

const COLUMNS = schemaColumnsOf({
  eval_trial: ['error_class', 'outcome', 'run_id'],
});

const RUN = '00000000-0000-4000-8000-000000000001';

const UNCLASSIFIED_TIMEOUT: Record<string, unknown> = JSON.parse(
  `{"errorClass": null, "outcome": "timeout", "runId": "${RUN}", "trials": 1}`,
);

describe('readRunHealth', () => {
  it('reads the error counts, a missing class as absent', async () => {
    const { client, sent } = scriptedClient({
      answer: () => [
        { errorClass: 'rate_limit', outcome: 'error', runId: RUN, trials: 2 },
        UNCLASSIFIED_TIMEOUT,
      ],
      columns: COLUMNS,
    });

    expect(await readRunHealth({ client, runIds: [RUN] })).toEqual([
      { errorClass: 'rate_limit', outcome: 'error', runId: RUN, trials: 2 },
      { errorClass: undefined, outcome: 'timeout', runId: RUN, trials: 1 },
    ]);
    expect(sent.at(-1)?.values).toEqual([[RUN]]);
  });

  it('rejects a passing outcome', async () => {
    const { client } = scriptedClient({
      answer: () => [{ ...UNCLASSIFIED_TIMEOUT, outcome: 'pass' }],
      columns: COLUMNS,
    });

    await expect(readRunHealth({ client, runIds: [RUN] })).rejects.toThrow(
      expect.objectContaining({
        issues: [expect.objectContaining({ path: [0, 'outcome'] })],
      }),
    );
  });
});
