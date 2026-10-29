/**
 * This package is public-facing and never baselines a finding, so the lazy
 * singleton below is expressed rather than suppressed.
 */

import { Pool } from 'pg';

import { readEnvConfig } from './env.schema.ts';

const poolRef: { current: Pool | undefined } = { current: undefined };

export const getPool = (): Pool => {
  if (!poolRef.current) {
    const envConfig = readEnvConfig({ env: process.env });
    const pool = new Pool({
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
    pool.on('error', (error: Error) => {
      if (pool.listenerCount('error') > 1) {
        return;
      }

      process.emitWarning(
        'An idle pooled connection failed; the pool dropped it.',
        { code: 'LCABRERA_SERVER_POOL_IDLE_ERROR', detail: error.message },
      );
    });
    poolRef.current = pool;
  }

  return poolRef.current;
};

export const closePool = async () => {
  if (!poolRef.current) {
    return;
  }

  await poolRef.current.end();
  poolRef.current = undefined;
};
