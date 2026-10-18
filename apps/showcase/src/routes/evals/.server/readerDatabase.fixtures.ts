import { EVALS_READER_ROLE } from '@repo/eval-history/migrate/migrate.constants';
import { migrateEvals } from '@repo/eval-history/migrate/migrateEvals.service';
import { readMigrations } from '@repo/eval-history/migrate/readMigrations.service';
import { readModelPrices } from '@repo/eval-history/prices/readModelPrices.service';
import { databaseUrl } from '@repo/eval-history/queries/databaseUrl.util';
import { closeEvalsReaderPool } from '@repo/eval-history/queries/evalsReaderPool.service';
import { scratchConnections } from '@repo/eval-history/testing/scratchConnections.service';
import { randomBytes, randomUUID } from 'node:crypto';
import { vi } from 'vite-plus/test';

type ReaderDatabaseArgs = {
  readonly prefix: string;
  readonly url: string;
};

export const readerDatabase = ({ prefix, url }: ReaderDatabaseArgs) => {
  const suffix = randomUUID().replaceAll('-', '').slice(0, 16);
  const databaseName = `${prefix}_${suffix}`;
  const password = randomBytes(16).toString('hex');
  const reader = { ...EVALS_READER_ROLE, name: `${prefix}_reader_${suffix}` };
  const { close, connect } = scratchConnections(url);
  const ownerUrl = new URL(url);

  ownerUrl.pathname = `/${databaseName}`;

  const open = async () => {
    const admin = await connect();

    await admin.query(`create database "${databaseName}"`);
    await admin.query(
      `create role "${reader.name}" login password '${password}'`,
    );

    const client = await connect(databaseName);

    await migrateEvals({
      client,
      migrations: await readMigrations(),
      prices: await readModelPrices(),
      roles: [reader],
    });
    vi.stubEnv('EVALS_DASHBOARD', '1');
    vi.stubEnv(
      'EVALS_READER_DATABASE_URL',
      databaseUrl({ database: databaseName, password, url, user: reader.name }),
    );

    return client;
  };

  const shut = async () => {
    vi.unstubAllEnvs();
    await closeEvalsReaderPool();
    await close({ databases: [databaseName], roles: [reader.name] });
  };

  return { open, ownerUrl: ownerUrl.href, shut };
};
