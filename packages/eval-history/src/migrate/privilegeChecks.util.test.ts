import { describe, expect, it } from 'vite-plus/test';

import { EVALS_ROLES, EVALS_WRITER_ROLE } from './migrate.constants.ts';
import { privilegeChecks } from './privilegeChecks.util.ts';

describe('privilegeChecks', () => {
  it('checks each privilege of each grant on its own', () => {
    expect(privilegeChecks(EVALS_WRITER_ROLE)).toEqual([
      { kind: 'schema', privilege: 'usage', schema: 'evals' },
      { kind: 'schema', privilege: 'create', schema: 'evals' },
      { kind: 'tables', privilege: 'select', schema: 'evals' },
      { kind: 'tables', privilege: 'insert', schema: 'evals' },
      { kind: 'tables', privilege: 'update', schema: 'evals' },
      { kind: 'tables', privilege: 'delete', schema: 'evals' },
    ]);
  });

  it('has a check for every grant the migrator issues', () => {
    expect(() =>
      EVALS_ROLES.map((role) => privilegeChecks(role)),
    ).not.toThrow();
  });

  it('refuses a grant target it cannot check', () => {
    expect(() =>
      privilegeChecks({
        grants: [{ on: 'all sequences in schema evals', privileges: 'usage' }],
        name: 'odd',
      }),
    ).toThrow('cannot check a grant on "all sequences in schema evals"');
  });
});
