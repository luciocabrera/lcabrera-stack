import { Pool } from "pg";

import { createApp } from "./app/app";
import { readEnvConfig } from "./config/env.util";
import { createDbSanityRepository } from "./features/dbSanity/dbSanity.repository";

const envConfig = readEnvConfig({ env: process.env });

const pool = new Pool({
  database: envConfig.DB_NAME,
  host: envConfig.DB_HOST,
  password: envConfig.DB_PASSWORD,
  port: envConfig.DB_PORT,
  user: envConfig.DB_USER,
});

const app = createApp({ envConfig, pool });

const server = app.listen(envConfig.API_PORT, "0.0.0.0", () => {
  console.warn(`🚀 API server running at http://localhost:${envConfig.API_PORT}`);
  console.warn(
    `🛠️ Delays: enterpriseOrders=${envConfig.ENTERPRISE_ORDERS_DELAY_MS}ms, distinctValues=${envConfig.DISTINCT_VALUES_DELAY_MS}ms`,
  );
});

const dbSanityRepository = createDbSanityRepository({ pool });

const runStartupDbSanityCheck = async (): Promise<void> => {
  try {
    const sanity = await dbSanityRepository.getDbSanity();

    if (sanity.isHealthy) {
      console.warn("✅ [DB Sanity] Table counts:", sanity.tableCounts);
      return;
    }

    console.warn("⚠️ [DB Sanity] Potential data/connection issues detected");

    for (const issue of sanity.issues) {
      console.warn(`   - ${issue}`);
    }

    console.warn("   - Run `vp run seed` in api-server to repopulate tables.");
  } catch (error: unknown) {
    console.error("❌ [DB Sanity] Startup sanity check failed:", error);
  }
};

const closeServer = (): Promise<void> =>
  new Promise(
    // eslint-disable-next-line local-rules/destructuring-for-functions
    (resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    },
  );

const shutdown = async (): Promise<void> => {
  console.warn("🛑 Shutting down API server");
  await closeServer();
  await pool.end();
};

// eslint-disable-next-line unicorn/prefer-top-level-await
void runStartupDbSanityCheck();

process.on("SIGINT", () => {
  void shutdown().catch((error: unknown) => {
    console.error("❌ Error during SIGINT shutdown:", error);
  });
});

process.on("SIGTERM", () => {
  void shutdown().catch((error: unknown) => {
    console.error("❌ Error during SIGTERM shutdown:", error);
  });
});
