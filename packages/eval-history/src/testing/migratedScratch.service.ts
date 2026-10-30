import pg from 'pg';

import { applyMigrations } from '../migrate/applyMigrations.service.ts';
import { readMigrations } from '../migrate/readMigrations.service.ts';

type MigratedScratchArgs = {
  readonly scratch: string;
  readonly scratchUrl: string;
  readonly tables: readonly string[];
  readonly url: string | undefined;
};

export const migratedScratch = ({
  scratch,
  scratchUrl,
  tables,
  url,
}: MigratedScratchArgs) => {
  const admin = new pg.Client({ connectionString: url });
  const client = new pg.Client({ connectionString: scratchUrl });

  const open = async () => {
    await admin.connect();
    await admin.query(`create database ${scratch}`);
    await client.connect();
    await applyMigrations({ client, migrations: await readMigrations() });
  };

  const qualified = tables.map((table) => `evals.${table}`).join(', ');
  const countColumns = tables
    .map((table) => `'${table}', (select count(*)::int from evals.${table})`)
    .join(', ');

  const empty = () => client.query(`truncate ${qualified} cascade`);

  const counts = async () => {
    const { rows } = await client.query<{ readonly counts: object }>(
      `select json_build_object(${countColumns}) as counts`,
    );

    return rows[0]?.counts;
  };

  const close = async () => {
    await client.end();
    await admin.query(`drop database if exists ${scratch} with (force)`);
    await admin.end();
  };

  return { client, close, counts, empty, open };
};
