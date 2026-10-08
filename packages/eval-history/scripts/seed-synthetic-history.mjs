/**
 * Fills an empty eval-history database with a year of synthetic nightly runs,
 * about 15k trials, so the reporting views can be timed and the dashboard
 * built against realistic volume. Applies `migrations/` first. Refuses a
 * database that already holds a run, so real history is never mixed with it.
 *
 * Usage: vp run --filter @repo/eval-history seed:synthetic
 * Exit codes: 0 seeded; 1 on an invalid env, a database that already holds
 * runs, or a failed statement.
 */
import process from 'node:process';
import pg from 'pg';

import { applyMigrations } from '../src/migrate/applyMigrations.service.ts';
import { evalsDatabaseEnvSchema } from '../src/migrate/evalsDatabaseEnv.schema.ts';
import { readMigrations } from '../src/migrate/readMigrations.service.ts';
import { seedSyntheticHistory } from '../src/seed/seedSyntheticHistory.service.ts';

const seed = async (connectionString) => {
  const client = new pg.Client({ connectionString });

  await client.connect();

  try {
    await applyMigrations({ client, migrations: await readMigrations() });

    return await seedSyntheticHistory({
      client,
      endsOn: new Date().toISOString().slice(0, 10),
    });
  } finally {
    await client.end();
  }
};

const env = evalsDatabaseEnvSchema.safeParse(process.env);

if (env.success) {
  try {
    const { runs, trials } = await seed(env.data.EVALS_DATABASE_URL);

    console.log(
      `seed:synthetic: wrote ${String(runs)} runs and ${String(trials)} trials`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
} else {
  console.error(
    'seed:synthetic: EVALS_DATABASE_URL must be a postgres:// URL (ADR-130)',
  );
  process.exitCode = 1;
}
