import { describe, expect, it } from 'vite-plus/test';

import { EVALS_WRITER_ROLE } from './migrate.constants.ts';
import { grantStatements, roleSetupStatements } from './roleStatements.util.ts';

describe('roleStatements', () => {
  it('grants the writer usage and create on the schema and DML on its tables', () => {
    expect(grantStatements(EVALS_WRITER_ROLE)).toEqual([
      'grant usage, create on schema evals to "evals_writer"',
      'grant select, insert, update, delete on all tables in schema evals to "evals_writer"',
    ]);
  });

  it('creates the role before granting to it', () => {
    expect(roleSetupStatements(EVALS_WRITER_ROLE)).toEqual([
      'create role "evals_writer" login',
      ...grantStatements(EVALS_WRITER_ROLE),
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
