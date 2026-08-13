import type { ClientBase, Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { getPool } from './get-pool.util.ts';
import { setStatementTimeout } from './set-statement-timeout.util.ts';

vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const poolQuery = vi.fn();
const txQuery = vi.fn();

const tx = () => ({ query: txQuery }) as unknown as ClientBase;

beforeEach(() => {
  poolQuery.mockReset();
  txQuery.mockReset();
  txQuery.mockResolvedValue({ rows: [{ set_config: '10000' }] });
  vi.mocked(getPool).mockReturnValue({ query: poolQuery } as unknown as Pool);
});

describe('setStatementTimeout', () => {
  it('sets the timeout transaction-locally through a bound parameter', async () => {
    await setStatementTimeout({ timeoutMs: 10_000, tx: tx() });

    const [text, values] = txQuery.mock.calls[0] ?? [];

    // `SET LOCAL statement_timeout = $1` is a syntax error — `SET` is a utility
    // statement and cannot be prepared — so the value would have to be spliced
    // into the SQL text. `set_config` is an ordinary function call, so it is a
    // parameter like any other.
    expect(text).toBe(`SELECT set_config('statement_timeout', $1, true)`);
    expect(values).toEqual(['10000']);
  });

  it('passes is_local as true, so the setting dies with the transaction', async () => {
    await setStatementTimeout({ timeoutMs: 250, tx: tx() });

    const [text] = txQuery.mock.calls[0] ?? [];

    // Without the third argument the setting persists on the pooled connection
    // and silently re-tunes every later query that borrows it — the classic
    // pooling bug, and one nothing fails on.
    expect(text).toContain(', true)');
  });

  it('never runs on the pool singleton', async () => {
    await setStatementTimeout({ timeoutMs: 10_000, tx: tx() });

    // On the pool this would scope itself to its own implicit transaction and
    // expire before the query it was meant to bound — silently, since the query
    // still succeeds.
    expect(poolQuery).not.toHaveBeenCalled();
  });

  it('sends the value as text, which is what set_config takes', async () => {
    await setStatementTimeout({ timeoutMs: 42, tx: tx() });

    expect(txQuery.mock.calls[0]?.[1]).toEqual(['42']);
  });
});
