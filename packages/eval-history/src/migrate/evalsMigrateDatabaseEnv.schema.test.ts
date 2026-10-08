import { describe, expect, it } from 'vite-plus/test';

import { evalsMigrateDatabaseEnvSchema } from './evalsMigrateDatabaseEnv.schema.ts';

describe('evalsMigrateDatabaseEnvSchema', () => {
  it.each([
    'postgres://migrator@localhost:5434/eval_history',
    'postgresql://migrator:secret@db.example:5432/eval_history',
  ])('accepts %s', (url) => {
    expect(
      evalsMigrateDatabaseEnvSchema.safeParse({
        EVALS_MIGRATE_DATABASE_URL: url,
      }).success,
    ).toBe(true);
  });

  it.each([undefined, '', 'https://example.com', 'not a url'])(
    'rejects %s',
    (url) => {
      expect(
        evalsMigrateDatabaseEnvSchema.safeParse({
          EVALS_MIGRATE_DATABASE_URL: url,
        }).success,
      ).toBe(false);
    },
  );

  it('does not accept the writer variable in its place', () => {
    expect(
      evalsMigrateDatabaseEnvSchema.safeParse({
        EVALS_DATABASE_URL:
          'postgres://evals_writer@localhost:5434/eval_history',
      }).success,
    ).toBe(false);
  });
});
