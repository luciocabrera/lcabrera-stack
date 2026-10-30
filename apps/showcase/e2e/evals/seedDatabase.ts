import {
  INSERT_BASELINE_SQL,
  SELECT_SUBJECT_ID_SQL,
} from '@repo/eval-history/baseline/baseline.constants';
import { ingestPaths } from '@repo/eval-history/ingest/ingestPaths.service';
import { memoryFileSystem } from '@repo/eval-history/ingest/memoryFileSystem.util';
import { EVALS_READER_ROLE } from '@repo/eval-history/migrate/migrate.constants';
import { migrateEvals } from '@repo/eval-history/migrate/migrateEvals.service';
import { readMigrations } from '@repo/eval-history/migrate/readMigrations.service';
import { readModelPrices } from '@repo/eval-history/prices/readModelPrices.service';
import pg from 'pg';

import type { EVALS_E2E_DATABASES, evalsE2eServer } from './evalsDatabase';

import { EVALS_E2E_READER } from './evalsDatabase';
import { seedEnvelope, seedGitSha } from './seedEnvelope';
import {
  SEED_ANNOTATION,
  SEED_MODEL,
  SEED_QUALITY_BASELINE,
  SEED_RUNS,
  SEED_STORY,
} from './seedStory';

type DatabaseArgs = {
  readonly database: Exclude<keyof typeof EVALS_E2E_DATABASES, 'missing'>;
  readonly server: Server;
};

type Server = ReturnType<typeof evalsE2eServer>;

const SKILLS_BASELINE = '0b5e1100-0000-4000-8000-000000000002';

const withClient = async <T>(
  connectionString: string,
  run: (client: pg.Client) => Promise<T>,
) => {
  const client = new pg.Client({ connectionString });

  await client.connect();

  try {
    return await run(client);
  } finally {
    await client.end();
  }
};

const RESET_STATEMENTS = [
  'drop database if exists "eval_history_e2e" with (force)',
  'drop database if exists "eval_history_e2e_empty" with (force)',
  'drop database if exists "eval_history_e2e_missing" with (force)',
  'create database "eval_history_e2e"',
  'create database "eval_history_e2e_empty"',
] as const;

const READER_ROLE_SQL = `do $$
begin
  if exists (select from pg_roles where rolname = 'eval_history_e2e_reader') then
    execute format('alter role eval_history_e2e_reader login password %L', current_setting('evals_e2e.reader_password'));
  else
    execute format('create role eval_history_e2e_reader login password %L', current_setting('evals_e2e.reader_password'));
  end if;
end
$$`;

const resetServer = (server: Server) =>
  withClient(server.adminUrl, async (admin) => {
    for (const statement of RESET_STATEMENTS) {
      await admin.query(statement);
    }

    await admin.query({
      text: "select set_config('evals_e2e.reader_password', $1, false)",
      values: [server.readerPassword],
    });
    await admin.query(READER_ROLE_SQL);
  });

const migrate = async ({ database, server }: DatabaseArgs) => {
  const [migrations, prices] = await Promise.all([
    readMigrations(),
    readModelPrices(),
  ]);
  const report = await withClient(server.urlOf(database), (client) =>
    migrateEvals({
      client,
      migrations,
      prices,
      roles: [{ ...EVALS_READER_ROLE, name: EVALS_E2E_READER }],
    }),
  );

  if (report.missing.length > 0 || report.ungranted.length > 0) {
    throw new Error(
      `the ${database} e2e database left ${EVALS_E2E_READER} without its grants`,
    );
  }
};

const ingestStory = async (server: Server) => {
  const files = Object.fromEntries(
    SEED_STORY.map((run) => [
      `/seed/${run.runId}.json`,
      JSON.stringify(seedEnvelope(run)),
    ]),
  );
  const ingested = await ingestPaths({
    connectionString: server.urlOf('seeded'),
    fileSystem: memoryFileSystem(files),
    paths: ['/seed'],
    quietUnreachable: false,
  });

  if (ingested.exitCode !== 0) {
    throw new Error(ingested.stderr.join('\n'));
  }
};

const recordHistory = (server: Server) =>
  withClient(server.urlOf('seeded'), async (client) => {
    const { rows } = await client.query<{ readonly id: string }>({
      text: SELECT_SUBJECT_ID_SQL,
      values: ['skill', 'react-19'],
    });

    await client.query({
      text: INSERT_BASELINE_SQL,
      values: [
        SKILLS_BASELINE,
        'skills',
        SEED_MODEL,
        undefined,
        'pass_rate',
        seedGitSha(SEED_RUNS.skillsPrevious),
        5,
        1,
        0,
      ],
    });
    await client.query({
      text: INSERT_BASELINE_SQL,
      values: [
        SEED_QUALITY_BASELINE,
        'skill-quality',
        SEED_MODEL,
        rows[0]?.id,
        'quality_overall',
        seedGitSha(SEED_RUNS.qualityBaselineThird),
        3,
        13 / 3,
        Math.sqrt(1 / 3),
      ],
    });
    await client.query({
      text: `insert into evals.eval_annotation (at, kind, text, author)
values ($1, $2, $3, $4)`,
      values: [
        SEED_ANNOTATION.at,
        SEED_ANNOTATION.kind,
        'e2e seed',
        'e2e-seed',
      ],
    });
  });

export const seedEvalsDatabases = async (server: Server) => {
  await resetServer(server);
  await migrate({ database: 'empty', server });
  await migrate({ database: 'seeded', server });
  await ingestStory(server);
  await recordHistory(server);
};
