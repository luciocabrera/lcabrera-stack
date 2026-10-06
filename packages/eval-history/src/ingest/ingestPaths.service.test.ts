import { describe, expect, it, vi } from 'vite-plus/test';

import { ingestPaths } from './ingestPaths.service.ts';

const URL_ = 'postgres://writer:secret@localhost:5434/eval_history';

describe('ingestPaths', () => {
  it('warns and exits 0 without a database when told to stay quiet', async () => {
    const connect = vi.fn();

    expect(
      await ingestPaths({
        connect,
        connectionString: undefined,
        paths: [],
        quietUnreachable: true,
      }),
    ).toMatchObject({ exitCode: 0, stdout: [] });
    expect(connect).not.toHaveBeenCalled();
  });

  it('fails without a database otherwise', async () => {
    expect(
      await ingestPaths({
        connectionString: '',
        paths: [],
        quietUnreachable: false,
      }),
    ).toMatchObject({ exitCode: 1 });
  });

  it('fails on a URL that is not postgres, even when quiet', async () => {
    expect(
      await ingestPaths({
        connectionString: 'mysql://localhost/evals',
        paths: [],
        quietUnreachable: true,
      }),
    ).toEqual({
      exitCode: 1,
      stderr: [
        'evals:ingest: EVALS_DATABASE_URL must be a postgres:// URL (ADR-130)',
      ],
      stdout: [],
    });
  });

  it('names a missing path and never logs the URL', async () => {
    const summary = await ingestPaths({
      connect: vi.fn(),
      connectionString: URL_,
      paths: ['/nonexistent/eval-results'],
      quietUnreachable: false,
    });

    expect(summary).toEqual({
      exitCode: 1,
      stderr: [
        'evals:ingest: no such file or directory: /nonexistent/eval-results',
      ],
      stdout: [],
    });
    expect(JSON.stringify(summary)).not.toContain('secret');
  });
});
