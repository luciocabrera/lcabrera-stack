import { describe, expect, it } from 'vite-plus/test';

import { evalsReaderEnvSchema } from './evalsReaderEnv.schema.ts';

describe('evalsReaderEnvSchema', () => {
  it('accepts a postgres URL', () => {
    expect(
      evalsReaderEnvSchema.parse({
        EVALS_READER_DATABASE_URL: 'postgres://reader@localhost/eval_history',
      }),
    ).toEqual({
      EVALS_READER_DATABASE_URL: 'postgres://reader@localhost/eval_history',
    });
  });

  it.each([undefined, '', 'mysql://reader@localhost/x'])(
    'rejects %j',
    (url) => {
      expect(
        evalsReaderEnvSchema.safeParse({ EVALS_READER_DATABASE_URL: url })
          .success,
      ).toBe(false);
    },
  );
});
