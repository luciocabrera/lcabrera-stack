import { z } from 'zod';

import type { Migration, MigrationClient } from './migrate.types.ts';

import { BOOTSTRAP_SQL, MIGRATION_LOCK_KEY } from './migrate.constants.ts';
import { MigrationDriftError } from './migrationDrift.error.ts';
import { migrationDriftIssues } from './migrationDriftIssues.util.ts';

type ApplyMigrationsArgs = {
  readonly client: MigrationClient;
  readonly migrations: readonly Migration[];
};

const appliedRowsSchema = z.array(
  z.object({
    name: z.string(),
    sha256: z.string(),
    version: z.number().int(),
  }),
);

const readApplied = async (client: MigrationClient) => {
  const { rows } = await client.query({
    text: 'select version, name, sha256 from evals.schema_migration order by version',
  });

  return appliedRowsSchema.parse(rows);
};

const applyNextMigration = async ({
  client,
  migrations,
}: ApplyMigrationsArgs) => {
  await client.query({ text: 'begin' });

  try {
    await client.query({
      text: 'select pg_advisory_xact_lock($1)',
      values: [MIGRATION_LOCK_KEY],
    });
    await client.query({ text: BOOTSTRAP_SQL });

    const applied = await readApplied(client);
    const issues = migrationDriftIssues({ applied, migrations });

    if (issues.length > 0) {
      throw new MigrationDriftError(issues);
    }

    const appliedVersions = new Set(applied.map(({ version }) => version));
    const pending = migrations.find(
      ({ version }) => !appliedVersions.has(version),
    );

    if (pending) {
      await client.query({ text: pending.sql });
      await client.query({
        text: 'insert into evals.schema_migration (version, name, sha256) values ($1, $2, $3)',
        values: [pending.version, pending.name, pending.sha256],
      });
    }

    await client.query({ text: 'commit' });

    return pending;
  } catch (error) {
    await client.query({ text: 'rollback' });
    throw error;
  }
};

type ApplyFromArgs = ApplyMigrationsArgs & {
  readonly applied: readonly Migration[];
};

const applyFrom = async ({
  applied,
  ...args
}: ApplyFromArgs): Promise<readonly Migration[]> => {
  const next = await applyNextMigration(args);

  return next ? applyFrom({ ...args, applied: [...applied, next] }) : applied;
};

export const applyMigrations = async (args: ApplyMigrationsArgs) =>
  applyFrom({ ...args, applied: [] });
