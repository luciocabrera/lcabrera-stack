import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { registerShutdownSignals } from '@repo/node-runtime/registerShutdownSignals.util';
import { runStartupDbSanityCheck } from 'api-shared';

import { createApp } from './app/app';
import { readEnvConfig } from './config/env.util';
import { createDbSanityRepository } from './features/dbSanity/dbSanity.repository';

const envConfig = readEnvConfig({ env: process.env });

// Source the pool from @lcabrera/server's singleton — the same one
// selectFilterOptions (behind /api/distinct) uses — so the process holds one
// pool, not two. getPool() reads DB_* from process.env, which envConfig above
// has already validated.
const pool = getPool();

const app = createApp({ envConfig, pool });

const server = app.listen(envConfig.API_PORT, '0.0.0.0', () => {
  console.warn(
    `🚀 API server running at http://localhost:${envConfig.API_PORT}`,
  );
  console.warn(
    `🛠️ Delays: enterpriseOrders=${envConfig.ENTERPRISE_ORDERS_DELAY_MS}ms, distinctValues=${envConfig.DISTINCT_VALUES_DELAY_MS}ms`,
  );
});

const dbSanityRepository = createDbSanityRepository({ pool });

const closeServer = (): Promise<void> =>
  new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const shutdown = async (): Promise<void> => {
  console.warn('🛑 Shutting down API server');
  await closeServer();
  await closePool();
};

void runStartupDbSanityCheck({
  dbSanityRepository,
  repopulateCommand: '`vp run seed` in api-server',
});

registerShutdownSignals({ shutdown });
