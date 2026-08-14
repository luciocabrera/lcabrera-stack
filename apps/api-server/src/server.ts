import { registerShutdownSignals } from '@lcabrera/node/registerShutdownSignals.util';
import { closePool } from '@lcabrera/server/db/get-pool.util';
import { runStartupDbSanityCheck } from 'api-shared';

import { createApp } from './app/app';
import { readEnvConfig } from './config/env.util';
import { createDbSanityRepository } from './features/dbSanity/dbSanity.repository';

const envConfig = readEnvConfig({ env: process.env });

// Every repository now reads through @lcabrera/server executors, which reach the
// getPool() singleton lazily (created on the first query, e.g. the startup
// sanity check). Nothing here holds a pool; shutdown closes the singleton.
const app = createApp({ envConfig });

const server = app.listen(envConfig.API_PORT, '0.0.0.0', () => {
  console.warn(
    `🚀 API server running at http://localhost:${envConfig.API_PORT}`,
  );
  console.warn(
    `🛠️ Delays: enterpriseOrders=${envConfig.ENTERPRISE_ORDERS_DELAY_MS}ms, distinctValues=${envConfig.DISTINCT_VALUES_DELAY_MS}ms`,
  );
});

const dbSanityRepository = createDbSanityRepository();

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
