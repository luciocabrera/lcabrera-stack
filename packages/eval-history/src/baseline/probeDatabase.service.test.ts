import { describe, expect, it, vi } from 'vite-plus/test';

import { probeDatabase } from './probeDatabase.service.ts';

const URL_ = 'postgres://writer:secret@localhost:5434/eval_history';

describe('probeDatabase', () => {
  it('connects, disconnects and reports nothing when the database answers', async () => {
    const end = vi.fn(() => Promise.resolve());
    const connect = vi.fn(() =>
      Promise.resolve({ client: { query: vi.fn() }, end }),
    );

    expect(await probeDatabase({ connect, connectionString: URL_ })).toEqual({
      ok: true,
    });
    expect(connect).toHaveBeenCalledWith(URL_);
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
      message: expect.stringMatching(/EVALS_DATABASE_URL is unset/u),
      ok: false,
    });
    expect(connect).not.toHaveBeenCalled();
  });
});
