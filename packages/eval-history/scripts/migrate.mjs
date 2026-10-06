/**
 * Applies `migrations/` to the eval-history database named by
 * EVALS_DATABASE_URL, under the advisory lock and checksum check ADR-130
 * decides. A changed applied file stops the run; a fix is a new migration.
 *
 * Usage: vp run evals:migrate
 * Exit codes: 0 applied or already current; 1 on an invalid env, a changed
 * applied file, or a failed migration.
 */
import process from 'node:process';
import pg from 'pg';

import { applyMigrations } from '../src/migrate/applyMigrations.service.ts';
import { evalsDatabaseEnvSchema } from '../src/migrate/evalsDatabaseEnv.schema.ts';
import { readMigrations } from '../src/migrate/readMigrations.service.ts';

const migrate = async (connectionString) => {
  const client = new pg.Client({ connectionString });

  await client.connect();

  try {
    return await applyMigrations({
      client,
      migrations: await readMigrations(),
    });
  } finally {
    await client.end();
  }
};

const report = (applied) =>
  applied.length === 0
    ? 'evals:migrate: already current'
    : applied.map(({ name }) => `evals:migrate: applied ${name}`).join('\n');

const env = evalsDatabaseEnvSchema.safeParse(process.env);

if (env.success) {
  try {
    console.log(report(await migrate(env.data.EVALS_DATABASE_URL)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
} else {
  console.error(
    'evals:migrate: EVALS_DATABASE_URL must be a postgres:// URL (ADR-130)',
  );
  process.exitCode = 1;
}
