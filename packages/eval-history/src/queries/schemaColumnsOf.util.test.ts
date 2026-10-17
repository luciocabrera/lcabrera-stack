import { describe, expect, it } from 'vite-plus/test';

import { schemaColumnsOf } from './schemaColumnsOf.util.ts';

describe('schemaColumnsOf', () => {
  it('lists each named column of each table as a non-text schema column', () => {
    expect(
      schemaColumnsOf({ eval_run: ['run_id'], eval_trial: ['id', 'outcome'] }),
    ).toEqual([
      {
        column: 'run_id',
        dataType: 'integer',
        table: 'eval_run',
        udtName: 'int4',
      },
      {
        column: 'id',
        dataType: 'integer',
        table: 'eval_trial',
        udtName: 'int4',
      },
      {
        column: 'outcome',
        dataType: 'integer',
        table: 'eval_trial',
        udtName: 'int4',
      },
    ]);
  });
});
