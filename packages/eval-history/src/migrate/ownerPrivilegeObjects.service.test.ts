import { describe, expect, it } from 'vite-plus/test';

import type { MigrationClient, MigrationQuery } from './migrate.types.ts';

import { ownerPrivilegeObjects } from './ownerPrivilegeObjects.service.ts';

const scriptedClient = (
  answer: (query: MigrationQuery) => readonly unknown[],
) => {
  const queries: MigrationQuery[] = [];
  const client: MigrationClient = {
    query: async (query) => {
      queries.push(query);

      return { rows: answer(query) };
    },
  };

  return { client, queries };
};

describe('ownerPrivilegeObjects', () => {
  it('asks the catalog for definer functions and owner-privilege views the role can reach', async () => {
    const { client, queries } = scriptedClient(({ text }) => [
      {
        name: text.includes('prosecdef')
          ? 'evals.probe(integer)'
          : 'evals.v_subject_trend',
      },
    ]);

    expect(await ownerPrivilegeObjects({ client, role: 'reader' })).toEqual({
      definerFunctions: ['evals.probe(integer)'],
      definerViews: ['evals.v_subject_trend'],
    });
    expect(queries.map(({ values }) => values)).toEqual([
      ['reader'],
      ['reader'],
    ]);
    expect(queries[1]?.text).toContain("option_name = 'security_invoker'");
    expect(queries[1]?.text).toContain(
      "has_table_privilege($1, c.oid, 'select')",
    );
    expect(queries[0]?.text).toContain(
      "has_function_privilege($1, p.oid, 'execute')",
    );
  });

  it('rejects a row without a name', async () => {
    const { client } = scriptedClient(() => [{ relname: 'v' }]);

    await expect(
      ownerPrivilegeObjects({ client, role: 'reader' }),
    ).rejects.toThrow();
  });
});
