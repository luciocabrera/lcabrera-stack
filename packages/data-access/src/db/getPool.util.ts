import { Pool } from 'pg';

import { readEnvConfig } from './env.schema.ts';

let pool: Pool | undefined;

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
  if (!pool) {
    const envConfig = readEnvConfig({ env: process.env });
    pool = new Pool({
      database: envConfig.DB_NAME,
      host: envConfig.DB_HOST,
      password: envConfig.DB_PASSWORD,
      port: envConfig.DB_PORT,
      user: envConfig.DB_USER,
    });
  }

  return pool;
};

export const closePool = async (): Promise<void> => {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = undefined;
};
