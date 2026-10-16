import { describe, expect, it } from 'vite-plus/test';

import { EVALS_BASE_COLUMNS_SQL } from './queries.constants.ts';
import { scriptedClient } from './scriptedClient.util.ts';

const columns = [
  { column: 'id', dataType: 'bigint', table: 'eval_trial', udtName: 'int8' },
];

describe('scriptedClient', () => {
  it('answers the schema read with the columns and anything else by script', async () => {
    const { client, sent } = scriptedClient({
      answer: ({ values }) => [{ echoed: values }],
      columns,
    });

    expect(
      await client.query({ text: EVALS_BASE_COLUMNS_SQL, values: [] }),
    ).toEqual({ rows: columns });
    expect(await client.query({ text: 'select 1', values: [1] })).toEqual({
      rows: [{ echoed: [1] }],
    });
    expect(sent).toHaveLength(2);
  });
});
