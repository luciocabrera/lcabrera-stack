/**
 * Fills an empty eval-history database with a year of synthetic nightly runs,
 * about 15k trials, so the reporting views can be timed and the dashboard
 * built against realistic volume. Migrates and grants first as the migrating
 * role EVALS_MIGRATE_DATABASE_URL names, then inserts as the writer
 * EVALS_DATABASE_URL names, so the writer owns nothing (ADR-134). Refuses a
 * database that already holds a run, so real history is never mixed with it.
 *
 * Usage: vp run --filter @repo/eval-history seed:synthetic
 * Exit codes: 0 seeded; 1 on an invalid env, a database that already holds
 * runs, or a failed statement.
 */
import process from 'node:process';
import pg from 'pg';

import { evalsDatabaseEnvSchema } from '../src/migrate/evalsDatabaseEnv.schema.ts';
import { evalsMigrateDatabaseEnvSchema } from '../src/migrate/evalsMigrateDatabaseEnv.schema.ts';
import { EVALS_ROLES } from '../src/migrate/migrate.constants.ts';
import { migrateEvals } from '../src/migrate/migrateEvals.service.ts';
import { readMigrations } from '../src/migrate/readMigrations.service.ts';
import { readModelPrices } from '../src/prices/readModelPrices.service.ts';
import { seedSyntheticHistory } from '../src/seed/seedSyntheticHistory.service.ts';

const withClient = async (connectionString, work) => {
  const client = new pg.Client({ connectionString });

  await client.connect();

  try {
    return await work(client);
  } finally {
    await client.end();
  }
};

const seed = async ({ migrateUrl, writerUrl }) => {
  const migrations = await readMigrations();
  const prices = await readModelPrices();

  await withClient(migrateUrl, (client) =>
    migrateEvals({ client, migrations, prices, roles: EVALS_ROLES }),
  );

  return withClient(writerUrl, (client) =>
    seedSyntheticHistory({
      client,
      endsOn: new Date().toISOString().slice(0, 10),
    }),
  );
};

const migrateEnv = evalsMigrateDatabaseEnvSchema.safeParse(process.env);
const writerEnv = evalsDatabaseEnvSchema.safeParse(process.env);

if (migrateEnv.success && writerEnv.success) {
  try {
    const { runs, trials } = await seed({
      migrateUrl: migrateEnv.data.EVALS_MIGRATE_DATABASE_URL,
      writerUrl: writerEnv.data.EVALS_DATABASE_URL,
    });

    console.log(
      `seed:synthetic: wrote ${String(runs)} runs and ${String(trials)} trials`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
} else {
  const invalid = [
    ...(migrateEnv.success
      ? []
      : ['EVALS_MIGRATE_DATABASE_URL (migrating role)']),
    ...(writerEnv.success ? [] : ['EVALS_DATABASE_URL (writer)']),
  ];

  console.error(
    `seed:synthetic: ${invalid.join(' and ')} must be a postgres:// URL (ADR-134)`,
  );
  process.exitCode = 1;
}
