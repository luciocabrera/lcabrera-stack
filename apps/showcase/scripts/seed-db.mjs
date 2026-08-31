/**
 * Creates the showcase's database and applies the DDL it owns in `db/`.
 *
 * Why: every table route in this app reads Postgres in this process, so the
 * showcase has to be able to build its own schema without reaching into another
 * workspace for the SQL or for the runner (#689). It talks to Postgres through
 * `pg` — the driver the app already runs on — rather than shelling out, so the
 * only things a fresh machine needs are Docker and Node. That is also why the
 * files in `db/` carry no `psql` meta-commands.
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
 * Three constraints the code cannot state. The DDL files are applied in the
 * order the list gives them, and each drops and recreates the tables it owns,
 * so the order is the dependency order rather than a preference. Each file is
 * sent as one simple query, which Postgres runs as a single implicit
 * transaction — a file applies whole or not at all. And a database name cannot
 * be a bound parameter in `CREATE DATABASE`, so it is interpolated, which is
 * why the name is checked to be an identifier and nothing else before it is
 * used.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from 'pg';

const WORKSPACE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const SQL_FILENAMES = ['setup_large_data.sql', 'setup_enterprise_orders.sql'];

const REQUIRED_ENV_KEYS = [
  'DB_HOST',
  'DB_NAME',
  'DB_PASSWORD',
  'DB_PORT',
  'DB_USER',
];

const MAINTENANCE_DATABASE = 'postgres';

const missingEnvKeys = (env) => REQUIRED_ENV_KEYS.filter((key) => !env[key]);

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

const applySqlFiles = ({ connection, database, sqlPaths }) =>
  withClient({
    connection,
    database,
    run: async (client) => {
      for (const sqlPath of sqlPaths) {
        console.log(`   applying ${sqlPath}`);
        await client.query(readFileSync(sqlPath, 'utf8'));
      }
    },
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

  await applySqlFiles({
    connection,
    database,
    sqlPaths: SQL_FILENAMES.map((filename) =>
      join(WORKSPACE_ROOT, 'db', filename),
    ),
  });

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
