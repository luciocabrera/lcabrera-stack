import { describe, expect, it } from 'vite-plus/test';

import { scriptedIngestClient } from './scriptedIngestClient.util.ts';

describe('scriptedIngestClient', () => {
  it('answers each query from its text and records what was sent', async () => {
    const { client, queries, statements } = scriptedIngestClient({
      rowsFor: (text) => (text.includes('evals.eval_run') ? [{ id: 1 }] : []),
    });

    expect(
      await client.query({ text: 'select * from evals.eval_run', values: [1] }),
    ).toEqual({ rows: [{ id: 1 }] });
    expect(await client.query({ text: ' begin ' })).toEqual({ rows: [] });
    expect(queries).toEqual([
      { text: 'select * from evals.eval_run', values: [1] },
      { text: ' begin ' },
    ]);
    expect(statements()).toEqual(['evals.eval_run', 'begin']);
  });

  it('throws on the statement it is told to fail on, after recording it', async () => {
    const { client, queries } = scriptedIngestClient({
      failOn: 'evals.eval_trial',
      rowsFor: () => [],
    });

    await expect(
      client.query({ text: 'insert into evals.eval_trial' }),
    ).rejects.toThrow('failed on evals.eval_trial');
    expect(queries).toHaveLength(1);
  });
});
