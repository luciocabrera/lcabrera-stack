import { Pool } from 'pg';

import { readEnvConfig } from './env.schema.ts';

/**
 * The singleton lives on a `const` holder rather than a reassigned module-level
 * `let`: `getPool`/`closePool` mutate `poolRef.current` instead of the top-level
 * binding, which keeps them clear of `unicorn/no-top-level-assignment-in-function`.
 * packages/data-access is public-facing and never baselines a finding, so the
 * lazy singleton is expressed this way rather than suppressed.
 */
const poolRef: { current: Pool | undefined } = { current: undefined };

/**
 * Lazily-initialized singleton — shared across every Node-context consumer
 * of this package (packages/scan-ingestion's CLI + admin_system job code,
 * and potentially apps/api-server(-fast) in the future), none of which is
 * "the" single server process with one obvious place to construct a Pool
 * up front. Each process gets its own module-level singleton via getPool();
 * callers still supply their own DB_NAME et al. via env, so this is not a
 * cross-process shared connection.
 */
export const getPool = (): Pool => {
  if (!poolRef.current) {
    const envConfig = readEnvConfig({ env: process.env });
    poolRef.current = new Pool({
      database: envConfig.DB_NAME,
      host: envConfig.DB_HOST,
      password: envConfig.DB_PASSWORD,
      port: envConfig.DB_PORT,
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
