/**
 * Applies `migrations/` to the eval-history database named by
 * EVALS_MIGRATE_DATABASE_URL, under the advisory lock and checksum check
 * ADR-130 decides, upserts `model-prices.json` into evals.model_price, and
 * grants each existing role its privileges. It connects as the migrating role
 * that owns the evals objects, never as the writer EVALS_DATABASE_URL names
 * (ADR-134). A missing role is printed as the statements that create it.
 *
 * Usage: vp run evals:migrate
 * Exit codes: 0 applied or already current, missing roles included; 1 on an
 * invalid env, a changed applied file, an invalid price file, or a failed
 * statement.
 */
import process from 'node:process';
import pg from 'pg';

import { evalsMigrateDatabaseEnvSchema } from '../src/migrate/evalsMigrateDatabaseEnv.schema.ts';
import { EVALS_ROLES } from '../src/migrate/migrate.constants.ts';
import { migrateEvals } from '../src/migrate/migrateEvals.service.ts';
import { migrateReport } from '../src/migrate/migrateReport.util.ts';
import { readMigrations } from '../src/migrate/readMigrations.service.ts';
import { readModelPrices } from '../src/prices/readModelPrices.service.ts';

const migrate = async (connectionString) => {
  const migrations = await readMigrations();
  const prices = await readModelPrices();
  const client = new pg.Client({ connectionString });

  await client.connect();

  try {
    return await migrateEvals({
      client,
      migrations,
      prices,
      roles: EVALS_ROLES,
    });
  } finally {
    await client.end();
  }
};

const env = evalsMigrateDatabaseEnvSchema.safeParse(process.env);

if (env.success) {
  try {
    console.log(
      migrateReport(await migrate(env.data.EVALS_MIGRATE_DATABASE_URL)),
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
} else {
  console.error(
    'evals:migrate: EVALS_MIGRATE_DATABASE_URL must be a postgres:// URL naming the migrating role; EVALS_DATABASE_URL is the writer and is not read here (ADR-134)',
  );
  process.exitCode = 1;
}
