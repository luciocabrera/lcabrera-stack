import { describe, expect, it, vi } from 'vite-plus/test';

import { PROBE_WRITABLE_SQL } from './baseline.constants.ts';
import { probeDatabase } from './probeDatabase.service.ts';

const URL_ = 'postgres://writer:secret@localhost:5434/eval_history';

const answering = (query: () => Promise<{ readonly rows: unknown[] }>) => {
  const end = vi.fn(() => Promise.resolve());
  const client = { query: vi.fn(query) };

  return {
    client,
    connect: vi.fn(() => Promise.resolve({ client, end })),
    end,
  };
};

describe('probeDatabase', () => {
  it('asks whether the role can insert, disconnects, and reports nothing when it can', async () => {
    const { client, connect, end } = answering(() =>
      Promise.resolve({ rows: [{ writable: true }] }),
    );

    expect(await probeDatabase({ connect, connectionString: URL_ })).toEqual({
      ok: true,
    });
    expect(connect).toHaveBeenCalledWith(URL_);
    expect(client.query).toHaveBeenCalledWith({ text: PROBE_WRITABLE_SQL });
    expect(end).toHaveBeenCalledOnce();
  });

  it('refuses a database the role cannot insert into, naming the fix', async () => {
    const { connect, end } = answering(() =>
      Promise.resolve({ rows: [{ writable: false }] }),
    );

    expect(await probeDatabase({ connect, connectionString: URL_ })).toEqual({
      message: expect.stringMatching(
        /^evals:baseline: localhost:5434\/eval_history has no evals\.eval_run and evals\.eval_baseline this role can insert into, with delete on evals\.eval_baseline to rewrite a continued baseline; run `vp run evals:migrate`/u,
      ),
      ok: false,
    });
    expect(end).toHaveBeenCalledOnce();
  });

  it('reports a failed check and still disconnects', async () => {
    const { connect, end } = answering(() =>
      Promise.reject(new Error('permission denied for schema evals')),
    );

    expect(await probeDatabase({ connect, connectionString: URL_ })).toEqual({
      message:
        'evals:baseline: cannot check localhost:5434/eval_history: permission denied for schema evals',
      ok: false,
    });
    expect(end).toHaveBeenCalledOnce();
  });

  it('names the host and database, never the password, when it cannot connect', async () => {
    const problem = await probeDatabase({
      connect: () => Promise.reject(new Error('connect ECONNREFUSED')),
      connectionString: URL_,
    });

    expect(problem).toEqual({
      message:
        'evals:baseline: cannot reach localhost:5434/eval_history: connect ECONNREFUSED',
      ok: false,
    });
  });

  it('refuses an unset URL without connecting', async () => {
    const connect = vi.fn();

    expect(
      await probeDatabase({ connect, connectionString: undefined }),
    ).toEqual({
      message:
        'evals:baseline: EVALS_DATABASE_URL is unset, so there is nowhere to write the baseline (ADR-130)',
      ok: false,
    });
    expect(connect).not.toHaveBeenCalled();
  });

  it('refuses a foreign URL without connecting', async () => {
    const connect = vi.fn();

    expect(
      await probeDatabase({ connect, connectionString: 'mysql://h/db' }),
    ).toEqual({
      message:
        'evals:baseline: EVALS_DATABASE_URL must be a postgres:// URL (ADR-130)',
      ok: false,
    });
    expect(connect).not.toHaveBeenCalled();
  });
});
