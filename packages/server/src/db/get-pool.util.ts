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

export const closePool = async () => {
  if (!poolRef.current) {
    return;
  }

  await poolRef.current.end();
  poolRef.current = undefined;
};
