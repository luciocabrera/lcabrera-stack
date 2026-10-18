import { describe, expect, it } from 'vite-plus/test';

import { grantStatements } from './grantStatements.util.ts';
import { EVALS_WRITER_ROLE } from './migrate.constants.ts';

describe('grantStatements', () => {
  it('grants the writer usage on the schema and DML on its tables', () => {
    expect(grantStatements(EVALS_WRITER_ROLE)).toEqual([
      'grant usage on schema evals to "evals_writer"',
      'grant select, insert, update, delete on all tables in schema evals to "evals_writer"',
    ]);
  });

  it('grants a privilege on the listed columns only', () => {
    expect(
      grantStatements({
        grants: [
          {
            columns: ['run_id', 'suite'],
            on: 'table evals.eval_run',
            privileges: 'select, update',
          },
        ],
        name: 'reader',
      }),
    ).toEqual([
      'grant select ("run_id", "suite"), update ("run_id", "suite") on table evals.eval_run to "reader"',
    ]);
  });

  it('quotes a role name that holds a double quote', () => {
    expect(
      grantStatements({
        grants: [{ on: 'schema evals', privileges: 'usage' }],
        name: 'odd"name',
      }),
    ).toEqual(['grant usage on schema evals to "odd""name"']);
  });
});
