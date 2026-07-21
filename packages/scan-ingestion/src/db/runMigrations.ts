import { readEnvConfig } from '@repo/server/db/env.schema';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

import { readTextFileWithin } from '../fs/readTextFileWithin.util.ts';

const migrationsDirectory = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'migrations',
);

const getMigrationFiles = (): readonly string[] =>
  readdirSync(migrationsDirectory)
    .filter((file) => file.endsWith('.sql'))
    .toSorted((left, right) => left.localeCompare(right));

const ensureMigrationsTable = async (client: Client): Promise<void> => {
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS cqms;
    CREATE TABLE IF NOT EXISTS cqms.schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
};

const getAppliedMigrations = async (client: Client): Promise<Set<string>> => {
  const result = await client.query<{ filename: string }>(
    'SELECT filename FROM cqms.schema_migrations',
  );
  return new Set(result.rows.map((row) => row.filename));
};

type ApplyMigrationArgs = {
  readonly client: Client;
  readonly file: string;
};

const applyMigration = async ({
  client,
  file,
}: ApplyMigrationArgs): Promise<void> => {
  const sql = readTextFileWithin({
    baseDirectory: migrationsDirectory,
    targetPath: file,
  });

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      'INSERT INTO cqms.schema_migrations (filename) VALUES ($1)',
      [file],
    );
    await client.query('COMMIT');
    console.warn(`✅ Applied: ${file}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
};

const initDatabase = async (): Promise<boolean> => {
  const envConfig = readEnvConfig({ env: process.env });
  const dbName = envConfig.DB_NAME;
  const initClient = new Client({
    database: 'postgres',
    host: envConfig.DB_HOST,
    password: envConfig.DB_PASSWORD,
    port: envConfig.DB_PORT,
    user: envConfig.DB_USER,
  });
  await initClient.connect();

  try {
    // 2. Check if your target database already exists
    const res = await initClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );

    if (res.rowCount === 0) {
      console.info(`Database "${dbName}" does not exist. Creating it now...`);
      // Note: CREATE DATABASE cannot accept parameters via $1, so we escape it safely
      await initClient.query(`CREATE DATABASE "${dbName}"`);
      console.info(`Database "${dbName}" created successfully.`);
      await new Promise((resolve) => setTimeout(resolve, 200));
    } else {
      console.info(`Database "${dbName}" already exists.`);
    }
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  } finally {
    await initClient.end();
  }
};

const runMigrations = async (): Promise<void> => {
  const dbInitialized = await initDatabase();
  if (!dbInitialized) {
    console.error('❌ Database initialization failed');
    process.exitCode = 1;
    return;
  }
  const envConfig = readEnvConfig({ env: process.env });

  const client = new Client({
    database: envConfig.DB_NAME,
    host: envConfig.DB_HOST,
    password: envConfig.DB_PASSWORD,
    port: envConfig.DB_PORT,
    user: envConfig.DB_USER,
  });

  await client.connect();

  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    for (const file of getMigrationFiles()) {
      if (applied.has(file)) {
        console.warn(`⏭️  Skipping already-applied migration: ${file}`);
        continue;
      }

      console.warn(`▶️  Applying migration: ${file}`);
      await applyMigration({ client, file });
    }

    console.warn('✅ All migrations applied.');
  } finally {
    await client.end();
  }
};

try {
  await runMigrations();
} catch (error: unknown) {
  console.error('❌ Migration failed:', error);
  process.exitCode = 1;
}
