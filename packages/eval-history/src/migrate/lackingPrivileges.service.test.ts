import { describe, expect, it } from 'vite-plus/test';

import type { MigrationClient, MigrationQuery } from './migrate.types.ts';

import { lackingPrivileges } from './lackingPrivileges.service.ts';
import { EVALS_WRITER_ROLE } from './migrate.constants.ts';

const fakeClient = (rows: readonly unknown[]) => {
  const queries: MigrationQuery[] = [];
  const client: MigrationClient = {
    query: async (query) => {
      queries.push(query);

      return { rows };
    },
  };

  return { client, queries };
};

describe('lackingPrivileges', () => {
  it('passes the role and each schema and table check as parallel arrays', async () => {
    const { client, queries } = fakeClient([]);

    await lackingPrivileges({ client, role: EVALS_WRITER_ROLE });

    expect(queries.map(({ values }) => values)).toEqual([
      [
        'evals_writer',
        ['evals'],
        ['usage'],
        ['evals', 'evals', 'evals', 'evals'],
        ['select', 'insert', 'update', 'delete'],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
      ],
    ]);
  });

  it('passes each table check and each column check as parallel arrays', async () => {
    const { client, queries } = fakeClient([]);

    await lackingPrivileges({
      client,
      role: {
        grants: [
          { on: 'table evals.v_task_pass_rate', privileges: 'select' },
          {
            columns: ['run_id', 'suite'],
            on: 'table evals.eval_run',
            privileges: 'select',
          },
        ],
        name: 'reader',
      },
    });

    expect(queries.map(({ values }) => values)).toEqual([
      [
        'reader',
        [],
        [],
        [],
        [],
        ['evals'],
        ['v_task_pass_rate'],
        ['select'],
        ['evals', 'evals'],
        ['eval_run', 'eval_run'],
        ['run_id', 'suite'],
        ['select', 'select'],
      ],
    ]);
  });

  it('returns the rows the database reports as lacking', async () => {
    const lacking = [{ object: 'table evals.eval_run', privilege: 'insert' }];
    const { client } = fakeClient(lacking);

    expect(
      await lackingPrivileges({ client, role: EVALS_WRITER_ROLE }),
    ).toEqual(lacking);
  });

  it('sends no query for a role with no grants', async () => {
    const { client, queries } = fakeClient([]);

    expect(
      await lackingPrivileges({ client, role: { grants: [], name: 'bare' } }),
    ).toEqual([]);
    expect(queries).toEqual([]);
  });
});
