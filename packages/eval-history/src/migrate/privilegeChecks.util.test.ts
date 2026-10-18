import { describe, expect, it } from 'vite-plus/test';

import type { MigrationClient } from './migrate.types.ts';

import { EVALS_ROLES, EVALS_WRITER_ROLE } from './migrate.constants.ts';
import { privilegeChecks } from './privilegeChecks.util.ts';
import { resolveGrants } from './resolveGrants.service.ts';

const VIEW_ROWS = [{ name: 'v_task_pass_rate' }];

const COLUMN_ROWS = [
  { column: 'run_id', dataType: 'uuid', table: 'eval_run', udtName: 'uuid' },
];

const catalogClient: MigrationClient = {
  query: async ({ text }) => {
    const rows = text.includes("relkind = 'v'") ? VIEW_ROWS : COLUMN_ROWS;

    return { rows };
  },
};

describe('privilegeChecks', () => {
  it('checks each privilege of each grant on its own', () => {
    expect(privilegeChecks(EVALS_WRITER_ROLE)).toEqual([
      { kind: 'schema', privilege: 'usage', schema: 'evals' },
      { kind: 'tables', privilege: 'select', schema: 'evals' },
      { kind: 'tables', privilege: 'insert', schema: 'evals' },
      { kind: 'tables', privilege: 'update', schema: 'evals' },
      { kind: 'tables', privilege: 'delete', schema: 'evals' },
    ]);
  });

  it('checks a grant on one table, and a column grant column by column', () => {
    expect(
      privilegeChecks({
        grants: [
          { on: 'table evals.v_task_pass_rate', privileges: 'select' },
          {
            columns: ['run_id', 'suite'],
            on: 'table evals.eval_run',
            privileges: 'select',
          },
        ],
        name: 'reader',
      }),
    ).toEqual([
      {
        kind: 'table',
        privilege: 'select',
        schema: 'evals',
        table: 'v_task_pass_rate',
      },
      {
        column: 'run_id',
        kind: 'column',
        privilege: 'select',
        schema: 'evals',
        table: 'eval_run',
      },
      {
        column: 'suite',
        kind: 'column',
        privilege: 'select',
        schema: 'evals',
        table: 'eval_run',
      },
    ]);
  });

  it('has a check for every grant the migrator issues', async () => {
    const resolved = await Promise.all(
      EVALS_ROLES.map((role) => resolveGrants({ client: catalogClient, role })),
    );

    expect(() => resolved.map((role) => privilegeChecks(role))).not.toThrow();
  });

  it('refuses a grant target it cannot check', () => {
    expect(() =>
      privilegeChecks({
        grants: [{ on: 'all sequences in schema evals', privileges: 'usage' }],
        name: 'odd',
      }),
    ).toThrow('cannot check a grant on "all sequences in schema evals"');
  });

  it('refuses a target the migrator has not resolved', () => {
    expect(() =>
      privilegeChecks({
        grants: [{ on: 'all views in schema evals', privileges: 'select' }],
        name: 'odd',
      }),
    ).toThrow('cannot check a grant on "all views in schema evals"');
  });
});
