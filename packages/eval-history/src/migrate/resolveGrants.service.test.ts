import { describe, expect, it } from 'vite-plus/test';

import type { MigrationClient, MigrationQuery } from './migrate.types.ts';

import { EVALS_READER_ROLE, EVALS_WRITER_ROLE } from './migrate.constants.ts';
import { resolveGrants } from './resolveGrants.service.ts';

const SCHEMA_COLUMNS = [
  { column: 'run_id', dataType: 'uuid', table: 'eval_run', udtName: 'uuid' },
  { column: 'actor', dataType: 'text', table: 'eval_run', udtName: 'text' },
  { column: 'totals', dataType: 'jsonb', table: 'eval_run', udtName: 'jsonb' },
  {
    column: 'settings_public',
    dataType: 'jsonb',
    table: 'eval_run',
    udtName: 'jsonb',
  },
  {
    column: 'settings',
    dataType: 'jsonb',
    table: 'eval_run',
    udtName: 'jsonb',
  },
  {
    column: 'version',
    dataType: 'integer',
    table: 'schema_migration',
    udtName: 'int4',
  },
  {
    column: 'score',
    dataType: 'smallint',
    table: 'eval_human_grade',
    udtName: 'int2',
  },
  {
    column: 'grader',
    dataType: 'text',
    table: 'eval_human_grade',
    udtName: 'text',
  },
];

const VIEW_ROWS = [{ name: 'v_subject_trend' }, { name: 'v_judge' }];

const fakeCatalogClient = () => {
  const queries: MigrationQuery[] = [];
  const client: MigrationClient = {
    query: async (query) => {
      queries.push(query);

      const rows = query.text.includes("relkind = 'v'")
        ? VIEW_ROWS
        : SCHEMA_COLUMNS;

      return { rows };
    },
  };

  return { client, queries };
};

describe('resolveGrants', () => {
  it('grants the reader each view, and only the columns it may read of each base table', async () => {
    const { client } = fakeCatalogClient();
    const role = await resolveGrants({ client, role: EVALS_READER_ROLE });

    expect(role).toEqual({
      grants: [
        { on: 'schema evals', privileges: 'usage' },
        { on: 'table evals.v_subject_trend', privileges: 'select' },
        { on: 'table evals.v_judge', privileges: 'select' },
        {
          columns: ['run_id', 'totals', 'settings_public'],
          on: 'table evals.eval_run',
          privileges: 'select',
        },
        {
          columns: ['score'],
          on: 'table evals.eval_human_grade',
          privileges: 'select',
        },
      ],
      name: 'evals_reader',
    });
  });

  it('reads the views of the schema the target names', async () => {
    const { client, queries } = fakeCatalogClient();

    await resolveGrants({
      client,
      role: {
        grants: [{ on: 'all views in schema other', privileges: 'select' }],
        name: 'odd',
      },
    });

    expect(queries.map(({ values }) => values)).toEqual([['other']]);
  });

  it('leaves a concrete grant as it is and reads no catalog for it', async () => {
    const { client, queries } = fakeCatalogClient();

    expect(await resolveGrants({ client, role: EVALS_WRITER_ROLE })).toEqual(
      EVALS_WRITER_ROLE,
    );
    expect(queries).toEqual([]);
  });
});
