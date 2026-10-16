import { describe, expect, it } from 'vite-plus/test';

import { EVALS_WRITER_ROLE } from './migrate.constants.ts';
import { missingRoleLines } from './missingRoleLines.util.ts';

describe('missingRoleLines', () => {
  it('names the role, then prints each setup statement indented and terminated', () => {
    expect(missingRoleLines(EVALS_WRITER_ROLE)).toEqual([
      'evals:migrate: role evals_writer does not exist; create it, then run evals:migrate again:',
      '  create role "evals_writer" login;',
      '  grant usage on schema evals to "evals_writer";',
      '  grant select, insert, update, delete on all tables in schema evals to "evals_writer";',
    ]);
  });

  it('prints only the create role line for a role with no grants', () => {
    expect(missingRoleLines({ grants: [], name: 'bare' })).toEqual([
      'evals:migrate: role bare does not exist; create it, then run evals:migrate again:',
      '  create role "bare" login;',
    ]);
  });
});
