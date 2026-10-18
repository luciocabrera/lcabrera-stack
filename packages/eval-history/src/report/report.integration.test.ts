// @vitest-environment node

/**
 * `evals:report --compare` against a real Postgres: the database path has to
 * print exactly what the envelope path prints for the same two runs, or a
 * comparison read from history would disagree with one read from CI
 * artifacts. The judge agreement section is the one difference, because hand
 * grades are stored only in the database. It creates a database of its own beside the one
 * EVALS_TEST_DATABASE_URL names and drops it afterwards. Unset, it skips
 * locally and fails under CI.
 */

import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import type { RunEnvelope } from '../envelope/envelope.types.ts';
import type { ReadEnvelope } from './report.types.ts';

import { INSERT_BASELINE_SQL } from '../baseline/baseline.constants.ts';
import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { judgeAgreementLines } from '../grades/judgeAgreementLines.util.ts';
import { sha256Hex } from '../hashing/sha256Hex.util.ts';
import { ingestPaths } from '../ingest/ingestPaths.service.ts';
import { memoryFileSystem } from '../ingest/memoryFileSystem.util.ts';
import { applyMigrations } from '../migrate/applyMigrations.service.ts';
import { readMigrations } from '../migrate/readMigrations.service.ts';
import { databaseUrl } from '../queries/databaseUrl.util.ts';
import { scratchConnections } from '../testing/scratchConnections.service.ts';
import { evalsReport } from './evalsReport.service.ts';
import { fixtureEnvelope } from './fixtureEnvelope.util.ts';
import { regressionConfigFixture } from './regressionConfigFixture.util.ts';
import {
  AGREEMENT_HEADING,
  AGREEMENT_NEEDS_DATABASE,
  REGRESSION_NEEDS_DATABASE,
} from './report.constants.ts';
import {
  hiddenSkillOutcomes,
  skillsRunFixture,
} from './skillsRunFixture.util.ts';

const DATABASE_URL = process.env.EVALS_TEST_DATABASE_URL;
const IS_CI = !['', '0', 'false'].includes(process.env.CI ?? '');
const SCRATCH = `evals_report_${String(process.pid)}_${String(Date.now())}`;
const FEATURE = 'feat/1234-tighten-react-19';
const THRESHOLDS = regressionConfigFixture();
const RULE_SCRATCH = `${SCRATCH}_rule`;
const SQL_NULL: unknown = JSON.parse('null');
const HIDDEN = 'feat/1274-hide-react-19';

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

const aborted = fixtureEnvelope({
  base,
  branch: 'feat/1235-aborted-run',
  outcomes: {
    'skills/react-19/trigger-1': ['pass', 'pass', 'pass'],
    'skills/react-19/trigger-2': ['pass', 'fail'],
    'skills/react-19/trigger-3': [],
  },
  runId: '00000000-0000-4000-8000-0000000000c1',
});

const RESULT_FILES = Object.fromEntries(
  [main, feature, aborted].map((envelope) => [
    `/results/skills/${envelope.run.run_id}.json`,
    JSON.stringify(envelope),
  ]),
);

const ENVELOPES = new Map([
  ['aborted.json', aborted],
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

const FILE_AGREEMENT = `\n\n${AGREEMENT_HEADING}\n\n${AGREEMENT_NEEDS_DATABASE}`;

const HISTORY_AGREEMENT = [
  '',
  AGREEMENT_HEADING,
  ...judgeAgreementLines({
    judges: [],
    minN: THRESHOLDS.minTrialsForRate,
    z: THRESHOLDS.z,
  }),
].join('\n\n');

const NO_BASELINE =
  'Regression rule: no baseline for claude-opus-5-5, so nothing is flagged. Record one with `vp run evals:baseline -- --suite skills` on that model before comparing.';

const flakyAgainst = (label: string) =>
  [
    'Flaky, left out of the rule:',
    `- \`skills/react-19/trigger-3\`: main 2/3, ${label} —; its trials disagreed in 1 of its last 1 runs`,
    `- \`skills/react-19/trigger-1\`: main 3/3, ${label} ${label === FEATURE ? '1/3' : '3/3'}; its trials disagreed in 1 of its last 3 runs`,
    `- \`skills/react-19/trigger-2\`: main 3/3 (+1 not counted), ${label} ${label === FEATURE ? '3/3' : '1/2'}; its trials disagreed in 1 of its last 3 runs`,
  ].join('\n');

type WithHistoryArgs = {
  readonly fileMarkdown: string | undefined;
  readonly label: string;
};

const withHistory = ({ fileMarkdown = '', label }: WithHistoryArgs) => {
  expect(fileMarkdown.endsWith(FILE_AGREEMENT)).toBe(true);
  expect(fileMarkdown).toContain(REGRESSION_NEEDS_DATABASE);

  return `${fileMarkdown.slice(0, -FILE_AGREEMENT.length)}${HISTORY_AGREEMENT}`.replace(
    REGRESSION_NEEDS_DATABASE,
    () => `${NO_BASELINE}\n\n${flakyAgainst(label)}`,
  );
};

const ruleRun = (args: Omit<Parameters<typeof skillsRunFixture>[0], 'base'>) =>
  skillsRunFixture({ ...args, base });

const WOBBLES = ['pass', 'fail', 'pass'] as const;

const ruleMain = ruleRun({ runId: '00000000-0000-4000-8000-0000000000d1' });

const RULE_RUNS = {
  hidden: ruleRun({
    branch: HIDDEN,
    hidden: ['react-19'],
    outcomesOf: hiddenSkillOutcomes('react-19'),
    runId: '00000000-0000-4000-8000-0000000000d2',
  }),
  rerun: ruleRun({
    branch: HIDDEN,
    runId: '00000000-0000-4000-8000-0000000000d3',
  }),
  wobbleA: ruleRun({
    outcomesOf: (taskKey) =>
      taskKey === 'store-pattern/near-miss'
        ? WOBBLES
        : ['pass', 'pass', 'pass'],
    runId: '00000000-0000-4000-8000-0000000000d4',
  }),
  wobbleB: ruleRun({
    branch: HIDDEN,
    outcomesOf: (taskKey) =>
      taskKey === 'store-pattern/near-miss'
        ? ['fail', 'fail', 'pass']
        : ['pass', 'pass', 'pass'],
    runId: '00000000-0000-4000-8000-0000000000d5',
  }),
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
  const { close, connect } = scratchConnections(DATABASE_URL ?? '');
  const connectionString = databaseUrl({
    database: SCRATCH,
    url: DATABASE_URL ?? 'postgres://localhost',
  });

  const againstMain = (b: string) =>
    evalsReport({
      a: 'main.json',
      allowModelChange: false,
      b,
      connectionString,
      json: false,
      readEnvelope,
      thresholds: THRESHOLDS,
    });

  beforeAll(async () => {
    const admin = await connect();

    await admin.query(`create database ${SCRATCH}`);
    await applyMigrations({
      client: await connect(SCRATCH),
      migrations: await readMigrations(),
    });

    const ingested = await ingestPaths({
      connectionString,
      fileSystem: memoryFileSystem(RESULT_FILES),
      paths: ['/results'],
      quietUnreachable: false,
    });

    expect(ingested.exitCode).toBe(0);
  });

  afterAll(() => close({ databases: [SCRATCH] }));

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
    expect(fromHistory.stdout).toEqual([
      withHistory({ fileMarkdown: fromFiles.stdout[0], label: FEATURE }),
    ]);
    expect(fromHistory.stdout[0]).toContain('multiple causes');
    expect(fromHistory.stdout[0]).toContain('no hand grades yet');
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

  it('reads a run whose plan outran its trials the way its envelope reads', async () => {
    const fromHistory = await againstMain(aborted.run.run_id);
    const fromFile = await againstMain('aborted.json');

    expect(fromHistory.exitCode).toBe(0);
    expect(fromHistory.stdout).toEqual([
      withHistory({
        fileMarkdown: fromFile.stdout[0],
        label: aborted.run.branch,
      }),
    ]);
    expect(fromHistory.stdout[0]).toContain(
      'Changed: no input hash, so nothing recorded explains a difference.',
    );
  });
});

const RULE_FILES = Object.fromEntries(
  [ruleMain, ...Object.values(RULE_RUNS)].map((envelope) => [
    `/results/skills/${envelope.run.run_id}.json`,
    JSON.stringify(envelope),
  ]),
);

describe.skipIf(!DATABASE_URL)('the regression rule against Postgres', () => {
  const { close, connect } = scratchConnections(DATABASE_URL ?? '');
  const connectionString = databaseUrl({
    database: RULE_SCRATCH,
    url: DATABASE_URL ?? 'postgres://localhost',
  });

  const againstRuleMain = (b: string) =>
    evalsReport({
      a: ruleMain.run.run_id,
      allowModelChange: false,
      b,
      connectionString,
      json: false,
      thresholds: THRESHOLDS,
    });

  beforeAll(async () => {
    const admin = await connect();

    await admin.query(`create database ${RULE_SCRATCH}`);

    const client = await connect(RULE_SCRATCH);

    await applyMigrations({ client, migrations: await readMigrations() });

    const ingested = await ingestPaths({
      connectionString,
      fileSystem: memoryFileSystem(RULE_FILES),
      paths: ['/results'],
      quietUnreachable: false,
    });

    expect(ingested.exitCode).toBe(0);

    await client.query({
      text: INSERT_BASELINE_SQL,
      values: [
        randomUUID(),
        'skills',
        'claude-opus-5-5',
        SQL_NULL,
        'pass_rate',
        ruleMain.run.git_sha,
        5,
        1,
        0,
      ],
    });
  });

  afterAll(() => close({ databases: [RULE_SCRATCH] }));

  it('flags a run with a hidden skill and names the skill', async () => {
    const { exitCode, stdout } = await againstRuleMain(
      RULE_RUNS.hidden.run.run_id,
    );

    expect(exitCode).toBe(0);
    expect(stdout[0]).toContain(
      '**Regression flagged** in the suite pass rate, skill `react-19`:',
    );
    expect(stdout[0]).toContain(
      '- skill `react-19`: `react-19/trigger` failed 3 of 3 counted trials',
    );
  });

  it('flags nothing on an unchanged rerun', async () => {
    const { stdout } = await againstRuleMain(RULE_RUNS.rerun.run.run_id);

    expect(stdout[0]).toContain('Regression rule: nothing flagged.');
    expect(stdout[0]).not.toContain('Regression flagged');
  });

  it('lists the task whose trials disagree across runs as flaky, and does not flag it', async () => {
    const { stdout } = await againstRuleMain(RULE_RUNS.wobbleB.run.run_id);

    expect(stdout[0]).toContain(
      '- `store-pattern/near-miss`: main 3/3, feat/1274-hide-react-19 1/3; its trials disagreed in 2 of its last 5 runs',
    );
    expect(stdout[0]).toContain('Regression rule: nothing flagged.');
  });
});
