import { describe, expect, it } from 'vite-plus/test';

import type { MigrationClient, MigrationQuery } from './migrate.types.ts';

import { exposedRoles } from './exposedRoles.service.ts';
import { EVALS_READER_ROLE, EVALS_WRITER_ROLE } from './migrate.constants.ts';

const definerViewsOf = (exposedRole: string) => {
  const queries: MigrationQuery[] = [];
  const client: MigrationClient = {
    query: async (query) => {
      queries.push(query);

      return {
        rows:
          query.values?.[0] === exposedRole && !query.text.includes('prosecdef')
            ? [{ name: 'evals.v_subject_trend' }]
            : [],
      };
    },
  };

  return { client, queries };
};

describe('exposedRoles', () => {
  it('returns only the roles that reach an owner-privilege object', async () => {
    const { client, queries } = definerViewsOf('evals_reader');

    expect(
      await exposedRoles({
        client,
        roles: [EVALS_WRITER_ROLE, EVALS_READER_ROLE],
      }),
    ).toEqual([
      {
        definerFunctions: [],
        definerViews: ['evals.v_subject_trend'],
        role: EVALS_READER_ROLE,
      },
    ]);
    expect(queries.map(({ values }) => values?.[0])).toEqual([
      'evals_writer',
      'evals_writer',
      'evals_reader',
      'evals_reader',
    ]);
  });

  it('queries nothing for no roles', async () => {
    const { client, queries } = definerViewsOf('evals_reader');

    expect(await exposedRoles({ client, roles: [] })).toEqual([]);
    expect(queries).toEqual([]);
  });
});
