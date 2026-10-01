/**
 * Creates the showcase's database and applies the DDL for every table it serves.
 *
 * Why: every table route in this app reads Postgres in this process, so the
 * showcase has to be able to build its own schema (#689). It talks to Postgres
 * through `pg` — the driver the app already runs on — rather than shelling out,
 * so a fresh machine needs only Docker and Node, and no applied file may carry a
 * `psql` meta-command. What it applies, and from where, is
 * `./seed-db-sources.mjs`: `enterprise_orders` comes from the file
 * `@lcabrera/devkit` ships, not from a copy here (ADR-071).
 *
 * Connection settings come from the same five `DB_*` variables the app itself
 * requires (`@lcabrera/server`'s env schema), loaded by the `seed` script from
 * the shared local env file and then the workspace one. There are no defaults on
 * purpose: a wrong guess surfaces as an authentication failure somewhere else.
 *
 * Usage:
 *   vp run --filter showcase seed      seed a running database
 *   vp run --filter showcase db:seed   bring the database up, then seed
 *
 * Exit codes: 0 = seeded, 1 = env is incomplete, or a statement failed.
 *
 * Three constraints the code cannot state. The sources are applied in the
 * order the list gives them, and each drops and recreates the tables it owns,
 * so the order is the dependency order rather than a preference. Each file is
 * sent as one simple query, which Postgres runs as a single implicit
 * transaction — a file applies whole or not at all. And a database name cannot
 * be a bound parameter in `CREATE DATABASE`, so it is interpolated, which is
 * why the name is checked to be an identifier and nothing else before it is
 * used.
 */
import { readFileSync } from 'node:fs';
import { Client } from 'pg';

import { SEED_SOURCES } from './seed-db-sources.mjs';

const REQUIRED_ENV_KEYS = [
  'DB_HOST',
  'DB_NAME',
  'DB_PASSWORD',
  'DB_PORT',
  'DB_USER',
];

const MAINTENANCE_DATABASE = 'postgres';

const missingEnvKeys = (env) =>
  REQUIRED_ENV_KEYS.filter((key) => (env[key] ?? '') === '');

const readSettings = (env) => ({
  connection: {
    host: env.DB_HOST,
    password: env.DB_PASSWORD,
    port: Number(env.DB_PORT),
    user: env.DB_USER,
  },
  database: env.DB_NAME,
});

const assertSafeDatabaseName = (name) => {
  if (!/^[A-Za-z_]\w*$/.test(name)) {
    throw new Error(
      `Unsafe DB_NAME '${name}'. Only letters, numbers, and underscores are allowed.`,
    );
  }
};

const withClient = async ({ connection, database, run }) => {
  const client = new Client({ ...connection, database });
  await client.connect();

  try {
    return await run(client);
  } finally {
    await client.end();
  }
};

const ensureDatabaseExists = async ({ connection, database }) => {
  assertSafeDatabaseName(database);

  return withClient({
    connection,
    database: MAINTENANCE_DATABASE,
    run: async (client) => {
      const existing = await client.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [database],
      );

      if (existing.rowCount > 0) {
        return false;
      }

      await client.query(`CREATE DATABASE ${database}`);

      return true;
    },
  });
};

const applySources = ({ connection, database, sources }) =>
  withClient({
    connection,
    database,
    run: (client) =>
      sources.reduce(async (previous, { path, prepare }) => {
        await previous;
        console.log(`   applying ${path}`);
        return client.query(prepare(readFileSync(path, 'utf8')));
      }, Promise.resolve()),
  });

const main = async () => {
  const missing = missingEnvKeys(process.env);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. Provide them in docker/local/.env or apps/showcase/.env.`,
    );
  }

  const { connection, database } = readSettings(process.env);

  console.log('Seeding the showcase database...');
  console.log(
    `   host=${connection.host} port=${connection.port} db=${database} user=${connection.user}`,
  );

  if (await ensureDatabaseExists({ connection, database })) {
    console.log(`   created database: ${database}`);
  }

  await applySources({ connection, database, sources: SEED_SOURCES });

  console.log('Seeding finished successfully');
};

try {
  await main();
} catch (error) {
  console.error(
    'Seeding failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
}
