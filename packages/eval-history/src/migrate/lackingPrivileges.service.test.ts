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
        ['evals', 'evals'],
        ['usage', 'create'],
        ['evals', 'evals', 'evals', 'evals'],
        ['select', 'insert', 'update', 'delete'],
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
