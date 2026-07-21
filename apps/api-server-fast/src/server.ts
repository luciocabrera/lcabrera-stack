import { registerShutdownSignals } from '@repo/node-runtime/registerShutdownSignals.util';
import { runStartupDbSanityCheck } from 'api-shared';
import { Pool } from 'pg';

import { createApp } from './app/app';
import { readEnvConfig } from './config/env.util';
import { createDbSanityRepository } from './features/dbSanity/dbSanity.repository';

const envConfig = readEnvConfig({ env: process.env });

const pool = new Pool({
  database: envConfig.DB_NAME,
  host: envConfig.DB_HOST,
  password: envConfig.DB_PASSWORD,
  port: envConfig.DB_PORT,
  user: envConfig.DB_USER,
});

const app = createApp({ envConfig, pool });

const dbSanityRepository = createDbSanityRepository({ pool });

const start = async (): Promise<void> => {
  try {
    await app.listen({ host: '0.0.0.0', port: envConfig.API_PORT });
    console.warn(
      `🚀 API server (Fastify) running at http://localhost:${envConfig.API_PORT}`,
    );
    console.warn(
      `🛠️ Delays: enterpriseOrders=${envConfig.ENTERPRISE_ORDERS_DELAY_MS}ms, distinctValues=${envConfig.DISTINCT_VALUES_DELAY_MS}ms`,
    );
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

void start();
void runStartupDbSanityCheck({
  dbSanityRepository,
  repopulateCommand: '`vp run seed` in api-server',
});

const shutdown = async (): Promise<void> => {
  console.warn('🛑 Shutting down API server');
  await app.close();
  await pool.end();
};

registerShutdownSignals({ shutdown });
