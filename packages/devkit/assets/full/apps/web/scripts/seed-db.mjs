/**
 * Creates the application's database if it is missing, then applies the DDL in
 * `db/` to it in one transaction, so a failed seed leaves the previous table in
 * place rather than half of a new one.
 *
 * It talks to Postgres through `pg` rather than a `psql` on the host, so a
 * fresh machine needs Docker and Node and nothing else. The five `DB_*`
 * settings come from the `.env` file beside the compose file, loaded by the
 * `seed` task. None has a default, because a guessed credential fails later
 * and somewhere less clear.
 *
 * Usage: the `seed` task in this workspace, or `db:seed` at the root to start
 * the database first.
 * Exit codes: 0 = seeded, 1 = a setting is missing, or a statement failed.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const WORKSPACE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const DDL_FILE = 'setup_enterprise_orders.sql';

const REQUIRED_SETTINGS = [
  'DB_HOST',
  'DB_NAME',
  'DB_PASSWORD',
  'DB_PORT',
  'DB_USER',
];

const MAINTENANCE_DATABASE = 'postgres';

const DATABASE_NAME = /^[A-Za-z_]\w*$/;

const missingSettings = (env) =>
  REQUIRED_SETTINGS.filter((key) => (env[key] ?? '') === '');

const connectionFrom = (env) => ({
  host: env.DB_HOST,
  password: env.DB_PASSWORD,
  port: Number(env.DB_PORT),
  user: env.DB_USER,
});

const checkedDatabaseName = (name) => {
  if (!DATABASE_NAME.test(name)) {
    throw new Error(
      `DB_NAME '${name}' is not a plain identifier — use letters, digits and underscores, starting with a letter or an underscore.`,
    );
  }
  return name;
};

const withClient = async ({ connection, database, run }) => {
  const client = new pg.Client({ ...connection, database });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
};

const ensureDatabase = ({ connection, database }) =>
  withClient({
    connection,
    database: MAINTENANCE_DATABASE,
    run: async (client) => {
      const existing = await client.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [database],
      );
      if (existing.rowCount > 0) return false;
      await client.query(`CREATE DATABASE "${database}"`);
      return true;
    },
  });

const inTransaction = async ({ client, sql }) => {
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
};

const applySql = ({ connection, database, path }) =>
  withClient({
    connection,
    database,
    run: (client) => inTransaction({ client, sql: readFileSync(path, 'utf8') }),
  });

const main = async () => {
  const missing = missingSettings(process.env);
  if (missing.length > 0) {
    throw new Error(
      `missing setting(s): ${missing.join(', ')}. Create the .env file beside the compose file from its .env.example template.`,
    );
  }

  const connection = connectionFrom(process.env);
  const database = checkedDatabaseName(process.env.DB_NAME);

  console.log(
    `Seeding ${database} on ${connection.host}:${connection.port} as ${connection.user}`,
  );
  if (await ensureDatabase({ connection, database })) {
    console.log(`  created database ${database}`);
  }
  await applySql({
    connection,
    database,
    path: join(WORKSPACE_ROOT, 'db', DDL_FILE),
  });
  console.log(`  applied ${DDL_FILE}`);
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
