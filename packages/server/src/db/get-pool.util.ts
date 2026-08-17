import { Pool } from 'pg';

import { readEnvConfig } from './env.schema.ts';

/**
 * The singleton lives on a `const` holder rather than a reassigned module-level
 * `let`: `getPool`/`closePool` mutate `poolRef.current` instead of the top-level
 * binding, which keeps them clear of `unicorn/no-top-level-assignment-in-function`.
 * packages/server is public-facing and never baselines a finding, so the
 * lazy singleton is expressed this way rather than suppressed.
 */
const poolRef: { current: Pool | undefined } = { current: undefined };

/**
 * Lazily-initialized singleton — shared across every Node-context consumer
 * of this package — CLIs, job runners and HTTP servers alike, now all outside
 * this repository — none of which is
 * "the" single server process with one obvious place to construct a Pool
 * up front. Each process gets its own module-level singleton via getPool();
 * callers still supply their own DB_NAME et al. via env, so this is not a
 * cross-process shared connection.
 *
 * Because it is the single shared contract, the four tuning knobs are read from
 * the same env schema rather than hard-coded or forked per app: every Node
 * consumer inherits the bounded behaviour, and each deployment can still choose
 * its own ceilings. See `env.schema.ts` for what the defaults are and why.
 */
export const getPool = (): Pool => {
  if (!poolRef.current) {
    const envConfig = readEnvConfig({ env: process.env });
    poolRef.current = new Pool({
      connectionTimeoutMillis: envConfig.DB_CONNECTION_TIMEOUT_MS,
      database: envConfig.DB_NAME,
      host: envConfig.DB_HOST,
      idleTimeoutMillis: envConfig.DB_IDLE_TIMEOUT_MS,
      max: envConfig.DB_POOL_MAX,
      password: envConfig.DB_PASSWORD,
      port: envConfig.DB_PORT,
      statement_timeout: envConfig.DB_STATEMENT_TIMEOUT_MS,
      user: envConfig.DB_USER,
    });
  }

  return poolRef.current;
};

export const closePool = async (): Promise<void> => {
  if (!poolRef.current) {
    return;
  }

  await poolRef.current.end();
  poolRef.current = undefined;
};
