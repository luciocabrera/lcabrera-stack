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

const runStartupDbSanityCheck = async (): Promise<void> => {
  try {
    const sanity = await dbSanityRepository.getDbSanity();

    if (sanity.isHealthy) {
      console.warn('✅ [DB Sanity] Table counts:', sanity.tableCounts);
      return;
    }

    console.warn('⚠️ [DB Sanity] Potential data/connection issues detected');

    for (const issue of sanity.issues) {
      console.warn(`   - ${issue}`);
    }

    console.warn('   - Run `vp run seed` in api-server to repopulate tables.');
  } catch (error: unknown) {
    console.error('❌ [DB Sanity] Startup sanity check failed:', error);
  }
};

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
void runStartupDbSanityCheck();

const shutdown = async (): Promise<void> => {
  console.warn('🛑 Shutting down API server');
  await app.close();
  await pool.end();
};

process.on('SIGINT', () => {
  void shutdown().catch((error: unknown) => {
    console.error('❌ Error during SIGINT shutdown:', error);
  });
});
