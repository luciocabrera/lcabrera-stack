import { describe, expect, it } from 'vite-plus/test';

import { readerColumns } from './readerColumns.util.ts';

type ColumnArgs = {
  readonly dataType?: string;
  readonly qualified: string;
};

const column = ({ dataType = 'integer', qualified }: ColumnArgs) => {
  const [table = '', name = ''] = qualified.split('.', 2);

  return { column: name, dataType, table, udtName: dataType };
};

describe('readerColumns', () => {
  it('holds the public columns, the whole-jsonb columns and the public jsonb copies', () => {
    expect(
      readerColumns([
        column({ dataType: 'uuid', qualified: 'eval_run.run_id' }),
        column({ dataType: 'jsonb', qualified: 'eval_run.totals' }),
        column({ dataType: 'jsonb', qualified: 'eval_run.settings_public' }),
        column({
          dataType: 'jsonb',
          qualified: 'eval_trial_detail.detail_public',
        }),
      ]),
    ).toEqual(
      new Set([
        'eval_run.run_id',
        'eval_run.settings_public',
        'eval_run.totals',
        'eval_trial_detail.detail_public',
      ]),
    );
  });

  it('leaves out an excluded column, a jsonb source and an excluded table', () => {
    expect(
      readerColumns([
        column({ dataType: 'text', qualified: 'eval_run.actor' }),
        column({ dataType: 'jsonb', qualified: 'eval_run.settings' }),
        column({ dataType: 'jsonb', qualified: 'eval_trial_detail.detail' }),
        column({ qualified: 'schema_migration.version' }),
      ]),
    ).toEqual(new Set());
  });

  it('holds no public copy the schema does not have', () => {
    expect(
      readerColumns([
        column({ dataType: 'uuid', qualified: 'eval_run.run_id' }),
      ]),
    ).toEqual(new Set(['eval_run.run_id']));
  });
});
