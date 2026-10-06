import { describe, expect, it } from 'vite-plus/test';

import { evalsDatabaseEnvSchema } from './evalsDatabaseEnv.schema.ts';

describe('evalsDatabaseEnvSchema', () => {
  it.each([
    'postgres://writer@localhost:5434/eval_history',
    'postgresql://writer:secret@db.example:5432/eval_history',
  ])('accepts %s', (url) => {
    expect(
      evalsDatabaseEnvSchema.safeParse({ EVALS_DATABASE_URL: url }).success,
    ).toBe(true);
  });

  it.each([undefined, '', 'https://example.com', 'not a url'])(
    'rejects %s',
    (url) => {
      expect(
        evalsDatabaseEnvSchema.safeParse({ EVALS_DATABASE_URL: url }).success,
      ).toBe(false);
    },
  );
});
