import { describe, expect, it } from 'vite-plus/test';

import { databaseUrl } from './databaseUrl.util.ts';

describe('databaseUrl', () => {
  it('accepts a postgres URL', () => {
    expect(
      databaseUrl('postgres://writer@localhost:5434/eval_history'),
    ).toEqual({
      ok: true,
      url: 'postgres://writer@localhost:5434/eval_history',
    });
  });

  it('refuses an unset or foreign URL without echoing it', () => {
    expect(databaseUrl(undefined)).toMatchObject({
      message: expect.stringMatching(/EVALS_DATABASE_URL is unset/u),
      ok: false,
    });
    expect(databaseUrl('mysql://secret@host/db')).toEqual({
      message:
        'evals:baseline: EVALS_DATABASE_URL must be a postgres:// URL (ADR-130)',
      ok: false,
    });
  });
});
