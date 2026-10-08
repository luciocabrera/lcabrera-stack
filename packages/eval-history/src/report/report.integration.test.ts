// @vitest-environment node

/**
 * `evals:report --compare` against a real Postgres: the database path has to
 * print exactly what the envelope path prints for the same two runs, or a
 * comparison read from history would disagree with one read from CI
 * artifacts. It creates a database of its own beside the one
 * EVALS_TEST_DATABASE_URL names and drops it afterwards. Unset, it skips
 * locally and fails under CI.
 */

import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import type { RunEnvelope } from '../envelope/envelope.types.ts';
import type { ReadEnvelope } from './report.types.ts';

import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { sha256Hex } from '../hashing/sha256Hex.util.ts';
import { ingestPaths } from '../ingest/ingestPaths.service.ts';
import { memoryFileSystem } from '../ingest/memoryFileSystem.util.ts';
import { applyMigrations } from '../migrate/applyMigrations.service.ts';
import { readMigrations } from '../migrate/readMigrations.service.ts';
import { scratchDatabase } from '../migrate/scratchDatabase.service.ts';
import { evalsReport } from './evalsReport.service.ts';
import { fixtureEnvelope } from './fixtureEnvelope.util.ts';

const DATABASE_URL = process.env.EVALS_TEST_DATABASE_URL;
const IS_CI = !['', '0', 'false'].includes(process.env.CI ?? '');
const SCRATCH = `evals_report_${String(process.pid)}_${String(Date.now())}`;
const FEATURE = 'feat/1234-tighten-react-19';
const THRESHOLDS = { minTrialsForRate: 6, z: 1.96 };

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});
const base: RunEnvelope = runEnvelopeSchema.parse(fixtures.get('skills.json'));

const main = fixtureEnvelope({
  base,
  outcomes: {
    'skills/react-19/trigger-1': ['pass', 'pass', 'pass'],
    'skills/react-19/trigger-2': ['pass', 'error', 'pass', 'pass'],
    'skills/react-19/trigger-3': ['pass', 'pass', 'fail'],
  },
  runId: '00000000-0000-4000-8000-0000000000a1',
});

const feature = fixtureEnvelope({
  base,
  branch: FEATURE,
  catalogHash: sha256Hex('catalog edited'),
  contentHash: sha256Hex('react-19 edited'),
  costUsd: 1.45,
  durationMs: 15_000,
  outcomes: {
    'skills/react-19/trigger-1': ['fail', 'pass', 'fail'],
    'skills/react-19/trigger-2': ['pass', 'pass', 'pass'],
    'skills/react-19/trigger-4': ['pass', 'pass', 'pass'],
  },
  runId: '00000000-0000-4000-8000-0000000000b1',
});

const RESULT_FILES = Object.fromEntries(
  [main, feature].map((envelope) => [
    `/results/skills/${envelope.run.run_id}.json`,
    JSON.stringify(envelope),
  ]),
);

const ENVELOPES = new Map([
  ['feature.json', feature],
  ['main.json', main],
]);

const readEnvelope: ReadEnvelope = (file) => {
  const envelope = ENVELOPES.get(file);

  return Promise.resolve(
    envelope === undefined
      ? ({ file, ok: false, problems: ['absent'] } as const)
      : ({ envelope, file, ok: true, sha256: sha256Hex(file) } as const),
  );
};

if (!DATABASE_URL && !IS_CI) {
  process.stderr.write(
    'Skipping the Postgres report tests: EVALS_TEST_DATABASE_URL is unset.\n',
  );
}

it.runIf(IS_CI)('has a database to report from under CI', () => {
  expect(
    DATABASE_URL,
    'EVALS_TEST_DATABASE_URL must be set under CI',
  ).toBeTruthy();
});

describe.skipIf(!DATABASE_URL)('evalsReport against Postgres', () => {
  const { admin, client, connectionString } = scratchDatabase({
    adminUrl: DATABASE_URL,
    name: SCRATCH,
  });

  beforeAll(async () => {
    await admin.connect();
    await admin.query(`create database ${SCRATCH}`);
    await client.connect();
    await applyMigrations({ client, migrations: await readMigrations() });

    const ingested = await ingestPaths({
      connectionString,
      fileSystem: memoryFileSystem(RESULT_FILES),
      paths: ['/results'],
      quietUnreachable: false,
    });

    expect(ingested.exitCode).toBe(0);
  });

  afterAll(async () => {
    await client.end();
    await admin.query(`drop database if exists ${SCRATCH} with (force)`);
    await admin.end();
  });

  it('prints for --compare main what it prints for the same two envelopes', async () => {
    const fromHistory = await evalsReport({
      allowModelChange: false,
      branch: FEATURE,
      compare: 'main',
      connectionString,
      json: false,
      thresholds: THRESHOLDS,
    });
    const fromFiles = await evalsReport({
      a: 'main.json',
      allowModelChange: false,
      b: 'feature.json',
      connectionString: undefined,
      json: false,
      readEnvelope,
      thresholds: THRESHOLDS,
    });

    expect(fromHistory.stderr).toEqual([]);
    expect(fromHistory.exitCode).toBe(0);
    expect(fromHistory.stdout).toEqual(fromFiles.stdout);
    expect(fromHistory.stdout[0]).toContain('multiple causes');
  });

  it('reads a run by its id', async () => {
    const byId = await evalsReport({
      a: main.run.run_id,
      allowModelChange: false,
      b: 'feature.json',
      connectionString,
      json: true,
      readEnvelope,
      thresholds: THRESHOLDS,
    });

    expect(byId.exitCode).toBe(0);
    expect(JSON.parse(byId.stdout[0] ?? '')).toMatchObject({
      comparisons: [{ a: { runId: main.run.run_id }, kind: 'comparison' }],
    });
  });
});
