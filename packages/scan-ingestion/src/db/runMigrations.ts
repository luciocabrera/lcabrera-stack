import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from 'pg';

import { readEnvConfig } from './env.schema.ts';

const migrationsDirectory = join(
  dirname(fileURLToPath(import.meta.url)),
  'migrations',
);

const getMigrationFiles = (): readonly string[] =>
  readdirSync(migrationsDirectory)
    .filter((file) => file.endsWith('.sql'))
    .toSorted();

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

const applyMigration = async (client: Client, file: string): Promise<void> => {
  const sql = readFileSync(join(migrationsDirectory, file), 'utf8');

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

const runMigrations = async (): Promise<void> => {
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
      await applyMigration(client, file);
    }

    console.warn('✅ All migrations applied.');
  } finally {
    await client.end();
  }
};

runMigrations().catch((error: unknown) => {
  console.error('❌ Migration failed:', error);
  process.exitCode = 1;
});
