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

    expect(text).toBe(`SELECT set_config('statement_timeout', $1, true)`);
    expect(values).toEqual(['10000']);
  });

  it('passes is_local as true, so the setting dies with the transaction', async () => {
    await setStatementTimeout({ timeoutMs: 250, tx: tx() });

    const [text] = txQuery.mock.calls[0] ?? [];

    expect(text).toContain(', true)');
  });

  it('never runs on the pool singleton', async () => {
    await setStatementTimeout({ timeoutMs: 10_000, tx: tx() });

    expect(poolQuery).not.toHaveBeenCalled();
  });

  it('sends the value as text, which is what set_config takes', async () => {
    await setStatementTimeout({ timeoutMs: 42, tx: tx() });

    expect(txQuery.mock.calls[0]?.[1]).toEqual(['42']);
  });
});
