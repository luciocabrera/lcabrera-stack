import { describe, expect, it } from 'vite-plus/test';

import { evalsDatabaseUrl } from './evalsDatabaseUrl.util.ts';

const WHEN_UNSET = 'there is nowhere to write';

describe('evalsDatabaseUrl', () => {
  it('accepts a postgres URL', () => {
    expect(
      evalsDatabaseUrl({
        command: 'evals:x',
        connectionString: 'postgres://writer@localhost:5434/eval_history',
        whenUnset: WHEN_UNSET,
      }),
    ).toEqual({
      ok: true,
      url: 'postgres://writer@localhost:5434/eval_history',
    });
  });

  it('names the command and the consequence when the URL is unset', () => {
    expect(
      evalsDatabaseUrl({
        command: 'evals:x',
        connectionString: '',
        whenUnset: WHEN_UNSET,
      }),
    ).toEqual({
      message:
        'evals:x: EVALS_DATABASE_URL is unset, so there is nowhere to write (ADR-130)',
      ok: false,
      reason: 'unset',
    });
  });

  it('refuses a foreign URL without echoing it', () => {
    expect(
      evalsDatabaseUrl({
        command: 'evals:x',
        connectionString: 'mysql://secret@host/db',
        whenUnset: WHEN_UNSET,
      }),
    ).toEqual({
      message:
        'evals:x: EVALS_DATABASE_URL must be a postgres:// URL (ADR-130)',
      ok: false,
      reason: 'invalid',
    });
  });
});
