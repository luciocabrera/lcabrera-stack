import { describe, expect, it } from 'vite-plus/test';

import { EVALS_WRITER_ROLE } from './migrate.constants.ts';
import { migrateReport } from './migrateReport.util.ts';

const migration = {
  name: '0001-schema.sql',
  sha256: 'a'.repeat(64),
  sql: '',
  version: 1,
};

describe('migrateReport', () => {
  it('reports applied files, the price count and a granted role', () => {
    expect(
      migrateReport({
        applied: [migration],
        granted: [EVALS_WRITER_ROLE],
        missing: [],
        pricesUpserted: 3,
      }),
    ).toBe(
      [
        'evals:migrate: applied 0001-schema.sql',
        'evals:migrate: upserted 3 model prices',
        'evals:migrate: granted evals_writer',
      ].join('\n'),
    );
  });

  it('prints the create role and grant statements of a missing role', () => {
    expect(
      migrateReport({
        applied: [],
        granted: [],
        missing: [EVALS_WRITER_ROLE],
        pricesUpserted: 3,
      }),
    ).toBe(
      [
        'evals:migrate: already current',
        'evals:migrate: upserted 3 model prices',
        'evals:migrate: role evals_writer does not exist; create it, then run evals:migrate again:',
        '  create role "evals_writer" login;',
        '  grant usage on schema evals to "evals_writer";',
        '  grant select, insert, update, delete on all tables in schema evals to "evals_writer";',
      ].join('\n'),
    );
  });
});
