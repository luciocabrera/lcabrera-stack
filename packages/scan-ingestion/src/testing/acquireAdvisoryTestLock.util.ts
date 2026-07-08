import type { PoolClient } from 'pg';

import { getPool } from '@repo/data-access/db/getPool.util';

type AcquireAdvisoryTestLockArgs = {
  readonly lockName: string;
};

type AdvisoryTestLock = {
  readonly release: () => Promise<void>;
};

/**
 * Test-only helper: serializes test FILES that mutate globally-scoped DB
 * state (vitest runs files in parallel workers). A session-level advisory
 * lock must be taken and released on the SAME connection, so this holds a
 * dedicated client for the lock's lifetime — `pool.query` may braid the
 * two statements across different clients. First used by the
 * claimQueuedScan/failStaleRunningScans pair: the stale-scan sweep fails
 * EVERY 'running' scan in the database, which would clobber the claim
 * test's mid-flight scan without this.
 */
export const acquireAdvisoryTestLock = async ({
  lockName,
}: AcquireAdvisoryTestLockArgs): Promise<AdvisoryTestLock> => {
  const client: PoolClient = await getPool().connect();
  await client.query('SELECT pg_advisory_lock(hashtext($1))', [lockName]);
  return {
    release: async () => {
      await client.query('SELECT pg_advisory_unlock(hashtext($1))', [lockName]);
      client.release();
    },
  };
};
