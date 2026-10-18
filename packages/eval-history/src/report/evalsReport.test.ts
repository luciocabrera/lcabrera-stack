import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import type { RunEnvelope } from '../envelope/envelope.types.ts';
import type { QueryClient } from '../queries/queries.types.ts';
import type { ReadEnvelope } from './report.types.ts';

import { SELECT_LATEST_BASELINE_SQL } from '../baseline/baseline.constants.ts';
import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { judgeAgreementQuery } from '../grades/judgeAgreementQuery.util.ts';
import { sha256Hex } from '../hashing/sha256Hex.util.ts';
import { evalsReport } from './evalsReport.service.ts';
import { fixtureEnvelope } from './fixtureEnvelope.util.ts';
import { regressionConfigFixture } from './regressionConfigFixture.util.ts';
import {
  AGREEMENT_HEADING,
  AGREEMENT_NEEDS_DATABASE,
  REGRESSION_NEEDS_DATABASE,
} from './report.constants.ts';
import { reportRunFromEnvelope } from './reportRunFromEnvelope.util.ts';
import { reportRunQueries } from './reportRunQueries.util.ts';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});
const base: RunEnvelope = runEnvelopeSchema.parse(fixtures.get('skills.json'));

const MAIN_OUTCOMES = {
  'skills/react-19/near-miss-1': ['pass', 'pass', 'pass'],
  'skills/react-19/trigger-1': ['pass', 'pass', 'pass'],
  'skills/react-19/trigger-2': ['pass', 'pass', 'pass'],
  'skills/react-19/trigger-3': ['pass', 'pass', 'fail'],
} as const;

const FEATURE_OUTCOMES = {
  ...MAIN_OUTCOMES,
  'skills/react-19/trigger-1': ['pass', 'fail', 'fail'],
  'skills/react-19/trigger-3': ['pass', 'pass', 'pass'],
} as const;

const FEATURE = 'feat/1234-tighten-react-19';

const UNREPORTED_COST: Readonly<Record<string, unknown>> = JSON.parse(
  '{"cost_usd_reported":null}',
);

const mainRun = fixtureEnvelope({
  base,
  outcomes: MAIN_OUTCOMES,
  runId: '00000000-0000-4000-8000-000000000001',
});

const STORE_PATTERN = { kind: 'skill', name: 'store-pattern' } as const;
const STORE_TASK = 'skills/store-pattern/trigger-1';

const withStorePattern = runEnvelopeSchema.parse({
  ...mainRun,
  subjects: [
    ...mainRun.subjects,
    {
      ...mainRun.subjects[0],
      ...STORE_PATTERN,
      content_hash: sha256Hex('store-pattern'),
      path: '.github/skills/store-pattern/SKILL.md',
    },
  ],
  tasks: [
    ...mainRun.tasks,
    {
      ...mainRun.tasks[0],
      subject: STORE_PATTERN,
      task_hash: sha256Hex(STORE_TASK),
      task_key: STORE_TASK,
    },
  ],
  trials: [
    ...mainRun.trials,
    { ...mainRun.trials[0], task_key: STORE_TASK, trial_index: 0 },
  ],
});

const storePatternUnreached = runEnvelopeSchema.parse({
  ...withStorePattern,
  run: {
    ...withStorePattern.run,
    branch: FEATURE,
    run_id: '00000000-0000-4000-8000-000000000008',
    status: 'aborted',
  },
  trials: mainRun.trials,
});

const RUNS = {
  'few-main.json': fixtureEnvelope({
    base,
    outcomes: { 'skills/react-19/trigger-1': ['pass', 'error', 'fail'] },
    runId: '00000000-0000-4000-8000-000000000005',
  }),
  'few-one-cause.json': fixtureEnvelope({
    base,
    branch: FEATURE,
    contentHash: sha256Hex('react-19 edited'),
    outcomes: { 'skills/react-19/trigger-1': ['pass', 'timeout', 'pass'] },
    runId: '00000000-0000-4000-8000-000000000006',
  }),
  'main.json': mainRun,
  'no-cost.json': runEnvelopeSchema.parse({
    ...mainRun,
    run: {
      ...mainRun.run,
      branch: FEATURE,
      run_id: '00000000-0000-4000-8000-000000000007',
      totals: { ...mainRun.run.totals, ...UNREPORTED_COST },
    },
  }),
  'one-cause.json': fixtureEnvelope({
    base,
    branch: FEATURE,
    contentHash: sha256Hex('react-19 edited'),
    costUsd: 1.45,
    durationMs: 13_000,
    outcomes: FEATURE_OUTCOMES,
    runId: '00000000-0000-4000-8000-000000000002',
  }),
  'other-model.json': fixtureEnvelope({
    base,
    branch: FEATURE,
    modelId: 'claude-sonnet-5-5',
    outcomes: MAIN_OUTCOMES,
    runId: '00000000-0000-4000-8000-000000000004',
  }),
  'store-pattern-unreached.json': storePatternUnreached,
  'two-causes.json': fixtureEnvelope({
    base,
    branch: FEATURE,
    catalogHash: sha256Hex('catalog edited'),
    contentHash: sha256Hex('react-19 edited'),
    outcomes: FEATURE_OUTCOMES,
    runId: '00000000-0000-4000-8000-000000000003',
  }),
  'with-store-pattern.json': withStorePattern,
};

const readEnvelope: ReadEnvelope = (file) => {
  const envelope = RUNS[file as keyof typeof RUNS] as RunEnvelope | undefined;

  return Promise.resolve(
    envelope === undefined
      ? ({ file, ok: false, problems: ['could not read: ENOENT'] } as const)
      : ({ envelope, file, ok: true, sha256: sha256Hex(file) } as const),
  );
};

const SQL_NULL: unknown = JSON.parse('null');

const asDatabaseRow = (value: object) =>
  Object.fromEntries(
    Object.entries(value).map(([key, field]) => [key, field ?? SQL_NULL]),
  );

const JUDGE_ROW = {
  humanScore: 4,
  judgeModel: 'claude-opus-5-5',
  judgePromptHash: 'a'.repeat(64),
  judgeScore: 4,
};

const AGREEMENT_ROWS = [
  ...Array.from({ length: 5 }, () => JUDGE_ROW),
  { ...JUDGE_ROW, humanScore: 2 },
];

const CONFIG = regressionConfigFixture();

const storedMain = reportRunFromEnvelope(mainRun);
const storedQueries = reportRunQueries(storedMain.runId);

const BASELINE_ROW = {
  baselineId: '11111111-1111-4111-8111-111111111111',
  gitSha: 'b'.repeat(40),
  harnessVersion: mainRun.run.harness_version,
  mean: 1,
  metric: 'pass_rate',
  modelId: 'claude-opus-5-5',
  nRuns: 5,
  stddev: 0,
  subjectKind: SQL_NULL,
  subjectName: SQL_NULL,
  suite: 'skills',
};

const DATABASE_ROWS = new Map<string, readonly unknown[]>([
  [judgeAgreementQuery().text, AGREEMENT_ROWS],
  [SELECT_LATEST_BASELINE_SQL, [BASELINE_ROW]],
  [storedQueries.run.text, [asDatabaseRow(storedMain)]],
  [storedQueries.subjects.text, storedMain.subjects],
  [
    storedQueries.tasks.text,
    storedMain.tasks.map(({ subject, ...task }) =>
      asDatabaseRow({
        ...task,
        subjectKind: subject.kind,
        subjectName: subject.name,
      }),
    ),
  ],
]);

const databaseClient: QueryClient = {
  query: ({ text }) => Promise.resolve({ rows: DATABASE_ROWS.get(text) ?? [] }),
};

const connect = () =>
  Promise.resolve({ client: databaseClient, end: () => Promise.resolve() });

type ReportArgs = {
  readonly a: keyof typeof RUNS;
  readonly allowModelChange?: boolean;
  readonly b: keyof typeof RUNS;
  readonly json?: boolean;
};

const report = ({ a, allowModelChange = false, b, json = false }: ReportArgs) =>
  evalsReport({
    a,
    allowModelChange,
    b,
    connectionString: undefined,
    json,
    readEnvelope,
    thresholds: CONFIG,
  });

describe('evalsReport over fixture runs', () => {
  it('names the one hash that changed, with n and the interval on each side', async () => {
    const { exitCode, stdout } = await report({
      a: 'main.json',
      b: 'one-cause.json',
    });
    const [markdown = ''] = stdout;

    expect(exitCode).toBe(0);
    expect(markdown).toContain('`react-19` content hash. That is one cause.');
    expect(markdown).toMatch(/91\.7% \(n=12, \d+\.\d%–\d+\.\d%\)/u);
    expect(markdown).toMatchSnapshot();
  });

  it('names no cause for a skill the aborted run never reached', async () => {
    const { exitCode, stdout } = await report({
      a: 'with-store-pattern.json',
      b: 'store-pattern-unreached.json',
    });
    const [markdown = ''] = stdout;

    expect(exitCode).toBe(0);
    expect(markdown).toContain(`| ${STORE_TASK} | 1/1 | — |`);
    expect(markdown).toContain(
      'Changed: no input hash, so nothing recorded explains a difference.',
    );
  });

  it('says a cost was not reported without calling it reported', async () => {
    const { stdout } = await report({ a: 'main.json', b: 'no-cost.json' });

    expect(stdout[0]).toContain('Cost: $1.20 reported → not reported.');
  });

  it('says multiple causes when two hashes changed', async () => {
    const { exitCode, stdout } = await report({
      a: 'main.json',
      b: 'two-causes.json',
    });
    const [markdown = ''] = stdout;

    expect(exitCode).toBe(0);
    expect(markdown).toContain('skill catalog hash, `react-19` content hash');
    expect(markdown).toContain('multiple causes');
    expect(markdown).toMatchSnapshot();
  });

  it('says insufficient data, with n, when too few trials were counted', async () => {
    const { exitCode, stdout } = await report({
      a: 'few-main.json',
      b: 'few-one-cause.json',
    });
    const [markdown = ''] = stdout;

    expect(exitCode).toBe(0);
    expect(markdown).toContain(
      'insufficient data (n=2, 1 passed, 1 not counted)',
    );
    expect(markdown).toContain('A rate needs 6 counted trials');
    expect(markdown).toMatchSnapshot();
  });

  it('refuses runs of two models and says why', async () => {
    const { exitCode, stdout } = await report({
      a: 'main.json',
      b: 'other-model.json',
    });
    const [markdown = ''] = stdout;

    expect(exitCode).toBe(1);
    expect(markdown).toContain('not compared');
    expect(markdown).toContain('--allow-model-change');
    expect(markdown).not.toContain('Pass rate');
    expect(markdown).toMatchSnapshot();
  });

  it('compares runs of two models under --allow-model-change, listing the model as the change', async () => {
    const { exitCode, stdout } = await report({
      a: 'main.json',
      allowModelChange: true,
      b: 'other-model.json',
    });
    const [markdown = ''] = stdout;

    expect(exitCode).toBe(0);
    expect(markdown).toContain('(claude-opus-5-5 → claude-sonnet-5-5)');
    expect(markdown).toContain('Changed: model. That is one cause.');
    expect(markdown).toMatchSnapshot();
  });

  it('says judge agreement needs the database when both runs are files', async () => {
    const { stdout } = await report({ a: 'main.json', b: 'one-cause.json' });

    expect(
      stdout[0]?.endsWith(
        `\n\n${AGREEMENT_HEADING}\n\n${AGREEMENT_NEEDS_DATABASE}`,
      ),
    ).toBe(true);
  });

  it('prints the agreement lines from the database and otherwise what the files print', async () => {
    const fromDatabase = await evalsReport({
      a: storedMain.runId,
      allowModelChange: false,
      b: 'one-cause.json',
      connect,
      connectionString: 'postgres://report@localhost/evals',
      json: false,
      readEnvelope,
      thresholds: CONFIG,
    });
    const fromFiles = await report({ a: 'main.json', b: 'one-cause.json' });
    const [databaseMarkdown = ''] = fromDatabase.stdout;
    const [fileMarkdown = ''] = fromFiles.stdout;
    const comparisonsOf = (markdown: string) =>
      markdown.slice(0, markdown.lastIndexOf(`\n\n${AGREEMENT_HEADING}\n\n`));
    const ruleFromDatabase = [
      '**Regression flagged** in skill `react-19`:',
      '- skill `react-19`: `skills/react-19/trigger-1` failed 2 of 3 counted trials on feat/1234-tighten-react-19 after passing every trial on main',
    ].join('\n');

    expect(fromDatabase.exitCode).toBe(0);
    expect(comparisonsOf(fileMarkdown)).toContain(REGRESSION_NEEDS_DATABASE);
    expect(comparisonsOf(databaseMarkdown)).toBe(
      comparisonsOf(fileMarkdown).replace(
        REGRESSION_NEEDS_DATABASE,
        () => ruleFromDatabase,
      ),
    );
    expect(comparisonsOf(databaseMarkdown)).toContain('### skills: main');
    expect(databaseMarkdown).not.toContain(AGREEMENT_NEEDS_DATABASE);
    expect(databaseMarkdown).toContain(
      `\n\n${AGREEMENT_HEADING}\n\nJudge agreement (claude-opus-5-5, judge prompt aaaaaaaaaaaa): 83.3% (n=6 graded scores, 5 equal to the judge's; Wilson interval 43.6%–97.0% at z=1.96); mean gap 0.33 points`,
    );
  });

  it('carries the agreement read from the database in --json', async () => {
    const { stdout } = await evalsReport({
      a: storedMain.runId,
      allowModelChange: false,
      b: 'one-cause.json',
      connect,
      connectionString: 'postgres://report@localhost/evals',
      json: true,
      readEnvelope,
      thresholds: CONFIG,
    });

    expect(JSON.parse(stdout[0] ?? '')).toMatchObject({
      agreement: {
        judges: [{ judgeModel: 'claude-opus-5-5', meanGap: 2 / 6 }],
        kind: 'read',
      },
    });
  });

  it('prints the same comparison as JSON under --json', async () => {
    const { exitCode, stdout } = await report({
      a: 'main.json',
      b: 'one-cause.json',
      json: true,
    });
    const parsed: unknown = JSON.parse(stdout[0] ?? '');

    expect(exitCode).toBe(0);
    expect(parsed).toMatchObject({
      agreement: { kind: 'needs-database' },
      comparisons: [
        {
          changed: { changed: 'content:skill/react-19', kind: 'single' },
          kind: 'comparison',
        },
      ],
    });
    expect(parsed).toMatchSnapshot();
  });
});

describe('evalsReport input', () => {
  it('needs --compare or both --a and --b', async () => {
    const result = await evalsReport({
      a: 'main.json',
      allowModelChange: false,
      connectionString: undefined,
      json: false,
      readEnvelope,
      thresholds: CONFIG,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr[0]).toMatch(/pass --compare <branch>/u);
  });

  it('refuses --suite without --compare', async () => {
    const result = await evalsReport({
      a: 'main.json',
      allowModelChange: false,
      b: 'one-cause.json',
      connectionString: undefined,
      json: false,
      readEnvelope,
      suite: 'skills',
      thresholds: CONFIG,
    });

    expect(result.exitCode).toBe(1);
  });

  it('names a file it could not read', async () => {
    const { exitCode, stderr } = await report({
      a: 'main.json',
      b: 'absent.json' as keyof typeof RUNS,
    });

    expect(exitCode).toBe(1);
    expect(stderr[0]).toContain(
      'absent.json is neither a run id nor a readable envelope',
    );
  });

  it('needs EVALS_DATABASE_URL to compare against a branch', async () => {
    const result = await evalsReport({
      allowModelChange: false,
      branch: FEATURE,
      compare: 'main',
      connectionString: undefined,
      json: false,
      readEnvelope,
      thresholds: CONFIG,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr[0]).toContain('EVALS_DATABASE_URL is unset');
  });
});
