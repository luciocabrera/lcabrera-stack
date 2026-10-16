import { describe, expect, it } from 'vite-plus/test';

import { grantStatements } from './grantStatements.util.ts';
import { EVALS_WRITER_ROLE } from './migrate.constants.ts';
import { roleSetupStatements } from './roleSetupStatements.util.ts';

describe('roleSetupStatements', () => {
  it('creates the role as a login role before granting to it', () => {
    expect(roleSetupStatements(EVALS_WRITER_ROLE)).toEqual([
      'create role "evals_writer" login',
      ...grantStatements(EVALS_WRITER_ROLE),
    ]);
  });

  it('quotes the created role name', () => {
    expect(roleSetupStatements({ grants: [], name: 'odd"name' })).toEqual([
      'create role "odd""name" login',
    ]);
  });
});
