import { describe, expect, it } from 'vite-plus/test';

import { EVALS_WRITER_ROLE } from './migrate.constants.ts';
import { revokeStatements } from './revokeStatements.util.ts';

describe('revokeStatements', () => {
  it('revokes everything on each object the role is granted on', () => {
    expect(revokeStatements(EVALS_WRITER_ROLE)).toEqual([
      'revoke all on schema evals from "evals_writer"',
      'revoke all on all tables in schema evals from "evals_writer"',
    ]);
  });

  it('quotes a role name that holds a double quote', () => {
    expect(
      revokeStatements({
        grants: [{ on: 'schema evals', privileges: 'usage' }],
        name: 'odd"name',
      }),
    ).toEqual(['revoke all on schema evals from "odd""name"']);
  });
});
