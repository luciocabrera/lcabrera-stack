// @vitest-environment node

/**
 * The overview's regression banner against a real Postgres holding only two
 * main runs of the skills suite, read as the reader role. With history that
 * short, a flaky window that counted the two compared runs would call the
 * newer run's own 3/3 to 1/3 drop flaky and leave it out; the banner has to
 * judge flakiness without them, as evals:report does, and flag the drop.
 * Unset, it skips locally and fails under CI.
 */

import { INSERT_BASELINE_SQL } from '@repo/eval-history/baseline/baseline.constants';
import { ingestPaths } from '@repo/eval-history/ingest/ingestPaths.service';
import { memoryFileSystem } from '@repo/eval-history/ingest/memoryFileSystem.util';
import { EVALS_READER_ROLE } from '@repo/eval-history/migrate/migrate.constants';
import { migrateEvals } from '@repo/eval-history/migrate/migrateEvals.service';
import { readMigrations } from '@repo/eval-history/migrate/readMigrations.service';
import { readModelPrices } from '@repo/eval-history/prices/readModelPrices.service';
import { databaseUrl } from '@repo/eval-history/queries/databaseUrl.util';
import { closeEvalsReaderPool } from '@repo/eval-history/queries/evalsReaderPool.service';
import { fixtureEnvelope } from '@repo/eval-history/report/fixtureEnvelope.util';
import { markedEnvelopes } from '@repo/eval-history/testing/markedEnvelopes.util';
import { scratchConnections } from '@repo/eval-history/testing/scratchConnections.service';
import { randomBytes, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { loader } from '../overview/evals-overview.loader';

const DATABASE_URL = process.env.EVALS_TEST_DATABASE_URL;
const IS_CI = !['', '0', 'false'].includes(process.env.CI ?? '');
const MODEL = 'claude-opus-5-5';
const STEADY = 'skills/react-19/trigger-1';
const DROPPED = 'skills/react-19/trigger-2';
const SQL_NULL: unknown = JSON.parse('null');

const skillsBase = markedEnvelopes({
  marker: 'unused',
  startedAt: '2026-10-01T02:00:00.000Z',
}).find(({ run }) => run.suite === 'skills');

type RunArgs = {
  readonly dropped: readonly ('fail' | 'pass')[];
  readonly runId: string;
  readonly startedAt: string;
};

const mainRun = ({ dropped, runId, startedAt }: RunArgs) => {
  if (skillsBase === undefined) {
    throw new Error('markedEnvelopes holds no skills envelope');
  }

  const envelope = fixtureEnvelope({
    base: skillsBase,
    modelId: MODEL,
    outcomes: { [DROPPED]: dropped, [STEADY]: ['pass', 'pass', 'pass'] },
    runId,
  });

  return {
    ...envelope,
    run: {
      ...envelope.run,
      finished_at: startedAt,
      started_at: startedAt,
      status: 'complete' as const,
    },
  };
};

const OLDER = mainRun({
  dropped: ['pass', 'pass', 'pass'],
  runId: '00000000-0000-4000-8000-0000000001a1',
  startedAt: '2026-10-01T02:00:00.000Z',
});

const NEWER = mainRun({
  dropped: ['pass', 'fail', 'fail'],
  runId: '00000000-0000-4000-8000-0000000001b1',
  startedAt: '2026-10-02T02:00:00.000Z',
});

const RESULT_FILES = Object.fromEntries(
  [OLDER, NEWER].map((envelope) => [
    `/results/${envelope.run.run_id}.json`,
    JSON.stringify(envelope),
  ]),
);

if (!DATABASE_URL && !IS_CI) {
  process.stderr.write(
    'Skipping the /evals overview regression test: EVALS_TEST_DATABASE_URL is unset.\n',
  );
}

it.runIf(IS_CI)('has a database to judge the overview against', () => {
  expect(
    DATABASE_URL,
    'EVALS_TEST_DATABASE_URL must be set under CI',
  ).toBeTruthy();
});

describe.skipIf(!DATABASE_URL)(
  'the overview banner on two runs of history',
  () => {
    const suffix = randomUUID().replaceAll('-', '').slice(0, 16);
    const databaseName = `evals_overview_${suffix}`;
    const password = randomBytes(16).toString('hex');
    const reader = { ...EVALS_READER_ROLE, name: `evals_reader_ovr_${suffix}` };
    const { close, connect } = scratchConnections(DATABASE_URL ?? '');

    beforeAll(async () => {
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

      const scratchUrl = new URL(DATABASE_URL ?? '');

      scratchUrl.pathname = `/${databaseName}`;

      const ingested = await ingestPaths({
        connectionString: scratchUrl.href,
        fileSystem: memoryFileSystem(RESULT_FILES),
        paths: ['/results'],
        quietUnreachable: false,
      });

      expect(ingested.exitCode, ingested.stderr.join('\n')).toBe(0);

      await client.query({
        text: INSERT_BASELINE_SQL,
        values: [
          randomUUID(),
          'skills',
          MODEL,
          SQL_NULL,
          'pass_rate',
          OLDER.run.git_sha,
          5,
          1,
          0,
        ],
      });

      vi.stubEnv('EVALS_DASHBOARD', '1');
      vi.stubEnv(
        'EVALS_READER_DATABASE_URL',
        databaseUrl({
          database: databaseName,
          password,
          url: DATABASE_URL ?? '',
          user: reader.name,
        }),
      );
    }, 60_000);

    afterAll(async () => {
      vi.unstubAllEnvs();
      await closeEvalsReaderPool();
      await close({ databases: [databaseName], roles: [reader.name] });
    });

    it('flags a 3/3 to 1/3 drop in the newer run, which the flaky window does not count', async () => {
      const { regressions } = await loader();

      expect(regressions).toHaveLength(1);
      expect(regressions[0]).toMatchObject({
        findings: [{ failed: 2, kind: 'flip', taskKey: DROPPED, trials: 3 }],
        flakyLeftOut: [],
        latest: { runId: NEWER.run.run_id },
        previous: { runId: OLDER.run.run_id },
        suite: 'skills',
      });
    });
  },
);
