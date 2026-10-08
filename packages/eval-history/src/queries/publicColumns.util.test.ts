import { describe, expect, it } from 'vite-plus/test';

import { publicColumns } from './publicColumns.util.ts';

type ColumnArgs = {
  readonly dataType?: string;
  readonly qualified: string;
  readonly udtName?: string;
};

const column = ({
  dataType = 'integer',
  qualified,
  udtName = 'int4',
}: ColumnArgs) => {
  const [table = '', name = ''] = qualified.split('.', 2);

  return { column: name, dataType, table, udtName };
};

const text = (qualified: string) =>
  column({ dataType: 'text', qualified, udtName: 'text' });

const jsonb = (qualified: string) =>
  column({ dataType: 'jsonb', qualified, udtName: 'jsonb' });

describe('publicColumns', () => {
  it('keeps a column that carries no free text without listing it', () => {
    expect(
      publicColumns([column({ qualified: 'eval_trial.duration_ms' })]),
    ).toEqual(new Set(['eval_trial.duration_ms']));
  });

  it('keeps an allowed text column and drops every other text column', () => {
    expect(
      publicColumns([
        text('eval_task.task_key'),
        column({
          dataType: 'ARRAY',
          qualified: 'eval_task.tags',
          udtName: '_text',
        }),
        column({
          dataType: 'character varying',
          qualified: 'eval_task.note',
          udtName: 'varchar',
        }),
        column({
          dataType: 'ARRAY',
          qualified: 'eval_task.labels',
          udtName: '_varchar',
        }),
      ]),
    ).toEqual(new Set(['eval_task.tags', 'eval_task.task_key']));
  });

  it('drops a column excluded by name even when it holds no text', () => {
    expect(
      publicColumns([
        column({ qualified: 'eval_trial.transcript_bytes' }),
        column({
          dataType: 'timestamp with time zone',
          qualified: 'eval_trial.transcript_expires_at',
        }),
      ]),
    ).toEqual(new Set());
  });

  it('drops every jsonb column, including one whose fields all pass', () => {
    expect(
      publicColumns([jsonb('eval_run.totals'), jsonb('eval_run.settings')]),
    ).toEqual(new Set());
  });

  it('drops every column of an excluded table', () => {
    expect(
      publicColumns([
        column({ qualified: 'schema_migration.version' }),
        text('schema_migration.name'),
      ]),
    ).toEqual(new Set());
  });
});
