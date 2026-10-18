import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import type { RunEnvelope } from '../envelope/envelope.types.ts';
import type { QueryClient, SqlQuery } from '../queries/queries.types.ts';
import type { ReadEnvelope, ReportRun } from './report.types.ts';

import { SELECT_LATEST_BASELINE_SQL } from '../baseline/baseline.constants.ts';
import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { sha256Hex } from '../hashing/sha256Hex.util.ts';
import { flakyTasksQuery } from '../queries/flakyTasksQuery.util.ts';
import { evalsReport } from './evalsReport.service.ts';
import { regressionConfigFixture } from './regressionConfigFixture.util.ts';
import { reportRunFromEnvelope } from './reportRunFromEnvelope.util.ts';
import { reportRunQueries } from './reportRunQueries.util.ts';
import {
  hiddenSkillOutcomes,
  skillsRunFixture,
} from './skillsRunFixture.util.ts';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});
const base: RunEnvelope = runEnvelopeSchema.parse(fixtures.get('skills.json'));

const CONFIG = regressionConfigFixture();
const PASSES = ['pass', 'pass', 'pass'] as const;
const SQL_NULL: unknown = JSON.parse('null');
const MODEL = 'claude-opus-5-5';
const NEXT_MODEL = 'claude-next-1';
const FEATURE = 'feat/1274-hide-react-19';

const skillsRun = (
  args: Omit<Parameters<typeof skillsRunFixture>[0], 'base'>,
) => skillsRunFixture({ ...args, base });

const main = skillsRun({ runId: '00000000-0000-4000-8000-000000000101' });

const nextModelMain = skillsRun({
  modelId: NEXT_MODEL,
  runId: '00000000-0000-4000-8000-000000000102',
});

const FILES = new Map([
  [
    'hidden.json',
    skillsRun({
      branch: FEATURE,
      hidden: ['react-19'],
      outcomesOf: hiddenSkillOutcomes('react-19'),
      runId: '00000000-0000-4000-8000-000000000201',
    }),
  ],
  [
    'next-model-hidden.json',
    skillsRun({
      branch: FEATURE,
      hidden: ['react-19'],
      modelId: NEXT_MODEL,
      outcomesOf: hiddenSkillOutcomes('react-19'),
      runId: '00000000-0000-4000-8000-000000000203',
    }),
  ],
  [
    'rerun.json',
    skillsRun({
      branch: FEATURE,
      runId: '00000000-0000-4000-8000-000000000202',
    }),
  ],
  [
    'store-pattern-wobbles.json',
    skillsRun({
      branch: FEATURE,
      outcomesOf: (taskKey) =>
        taskKey === 'store-pattern/near-miss'
          ? ['pass', 'fail', 'fail']
          : PASSES,
      runId: '00000000-0000-4000-8000-000000000204',
    }),
  ],
]);

const readEnvelope: ReadEnvelope = (file) => {
  const envelope = FILES.get(file);

  return Promise.resolve(
    envelope === undefined
      ? ({ file, ok: false, problems: ['absent'] } as const)
      : ({ envelope, file, ok: true, sha256: sha256Hex(file) } as const),
  );
};

const asDatabaseRow = (value: object) =>
  Object.fromEntries(
    Object.entries(value).map(([key, field]) => [key, field ?? SQL_NULL]),
  );

const storedRows = (run: ReportRun) => ({
  run: [asDatabaseRow({ ...run, subjects: undefined, tasks: undefined })],
  subjects: run.subjects,
  tasks: run.tasks.map(({ subject, ...task }) =>
    asDatabaseRow({
      ...task,
      subjectKind: subject.kind,
      subjectName: subject.name,
    }),
  ),
});

const STORED = new Map(
  [main, nextModelMain].map((envelope) => [
    envelope.run.run_id,
    storedRows(reportRunFromEnvelope(envelope)),
  ]),
);

const QUERIES = reportRunQueries(main.run.run_id);

const baselineRow = (modelId: string) => ({
  baselineId: '11111111-1111-4111-8111-111111111111',
  gitSha: 'b'.repeat(40),
  harnessVersion: base.run.harness_version,
  mean: 1,
  metric: 'pass_rate',
  modelId,
  nRuns: 5,
  stddev: 0,
  subjectKind: SQL_NULL,
  subjectName: SQL_NULL,
  suite: 'skills',
});

type HistoryArgs = {
  readonly baselineModels?: readonly string[];
  readonly flaky?: readonly string[];
};

const historyClient = ({
  baselineModels = [MODEL],
  flaky = [],
}: HistoryArgs): QueryClient => {
  const answer = ({ text, values }: SqlQuery): readonly unknown[] => {
    const [first, second] = values;
    const stored = STORED.get(String(first));

    switch (text) {
      case flakyTasksQuery(CONFIG.flaky).text: {
        return flaky.map((taskKey) => ({
          disagreeFraction: 0.4,
          disagreeing: 4,
          runs: 10,
          suite: 'skills',
          taskKey,
        }));
      }
      case QUERIES.run.text: {
        return stored?.run ?? [];
      }
      case QUERIES.subjects.text: {
        return stored?.subjects ?? [];
      }
      case QUERIES.tasks.text: {
        return stored?.tasks ?? [];
      }
      case SELECT_LATEST_BASELINE_SQL: {
        return baselineModels.includes(String(second))
          ? [baselineRow(String(second))]
          : [];
      }
      default: {
        return [];
      }
    }
  };

  return {
    query: (query) => Promise.resolve({ rows: answer(query) }),
  };
};

type RuleReportArgs = HistoryArgs & {
  readonly a?: string;
  readonly allowModelChange?: boolean;
  readonly b: string;
  readonly json?: boolean;
};

const ruleReport = async ({
  a = main.run.run_id,
  allowModelChange = false,
  b,
  json = false,
  ...history
}: RuleReportArgs) => {
  const result = await evalsReport({
    a,
    allowModelChange,
    b,
    connect: () =>
      Promise.resolve({
        client: historyClient(history),
        end: () => Promise.resolve(),
      }),
    connectionString: 'postgres://report@localhost/evals',
    json,
    readEnvelope,
    thresholds: CONFIG,
  });

  expect(result.stderr).toEqual([]);

  return { exitCode: result.exitCode, output: result.stdout[0] ?? '' };
};

describe('evalsReport applies the regression rule', () => {
  it('flags a run with a hidden skill and names that skill', async () => {
    const { exitCode, output } = await ruleReport({ b: 'hidden.json' });

    expect(exitCode).toBe(0);
    expect(output).toContain(
      '**Regression flagged** in the suite pass rate, skill `react-19`:',
    );
    expect(output).toContain(
      '- skill `react-19`: `react-19/trigger` failed 3 of 3 counted trials',
    );
    expect(output).not.toContain('`store-pattern/');
    expect(output).not.toContain('react-19/trigger-2`');
  });

  it('carries the findings and their subject in --json', async () => {
    const { output } = await ruleReport({ b: 'hidden.json', json: true });

    expect(JSON.parse(output)).toMatchObject({
      comparisons: [
        {
          regression: {
            flaky: [],
            rule: {
              findings: [
                { kind: 'rate' },
                {
                  kind: 'flip',
                  subject: { kind: 'skill', name: 'react-19' },
                  taskKey: 'react-19/trigger',
                },
              ],
              kind: 'regression',
            },
          },
        },
      ],
    });
  });

  it('flags nothing on an unchanged rerun', async () => {
    const { exitCode, output } = await ruleReport({ b: 'rerun.json' });

    expect(exitCode).toBe(0);
    expect(output).toContain('Regression rule: nothing flagged.');
    expect(output).not.toContain('Regression flagged');
  });

  it('flags a regression-set task that stopped passing', async () => {
    const { output } = await ruleReport({ b: 'store-pattern-wobbles.json' });

    expect(output).toContain(
      '**Regression flagged** in skill `store-pattern`:',
    );
  });

  it('lists a flaky task with its trial split and leaves it out of the rule', async () => {
    const { output } = await ruleReport({
      b: 'store-pattern-wobbles.json',
      flaky: ['store-pattern/near-miss'],
    });

    expect(output).toContain('Regression rule: nothing flagged.');
    expect(output).toContain(
      [
        'Flaky, left out of the rule:',
        '- `store-pattern/near-miss`: main 3/3, feat/1274-hide-react-19 1/3; its trials disagreed in 4 of its last 10 runs',
      ].join('\n'),
    );
  });

  it('says there is no baseline for a model instead of flagging', async () => {
    const { exitCode, output } = await ruleReport({
      a: nextModelMain.run.run_id,
      b: 'next-model-hidden.json',
    });

    expect(exitCode).toBe(0);
    expect(output).toContain(
      `Regression rule: no baseline for ${NEXT_MODEL}, so nothing is flagged.`,
    );
    expect(output).not.toContain('Regression flagged');
  });

  it('flags the same runs once that model has a baseline', async () => {
    const { output } = await ruleReport({
      a: nextModelMain.run.run_id,
      b: 'next-model-hidden.json',
      baselineModels: [MODEL, NEXT_MODEL],
    });

    expect(output).toContain('**Regression flagged**');
  });

  it('says there is no baseline for a changed model, compared or refused', async () => {
    const allowed = await ruleReport({
      allowModelChange: true,
      b: 'next-model-hidden.json',
    });
    const refused = await ruleReport({ b: 'next-model-hidden.json' });

    expect(allowed.exitCode).toBe(0);
    expect(allowed.output).toContain(`no baseline for ${NEXT_MODEL}`);
    expect(allowed.output).not.toContain('Regression flagged');
    expect(refused.exitCode).toBe(1);
    expect(refused.output).toContain('not compared');
    expect(refused.output).toContain(`no baseline for ${NEXT_MODEL}`);
  });

  it('does not apply the rule across two models even with a baseline', async () => {
    const { output } = await ruleReport({
      allowModelChange: true,
      b: 'next-model-hidden.json',
      baselineModels: [MODEL, NEXT_MODEL],
    });

    expect(output).toContain(
      'Regression rule: not applied, because the two runs used different models.',
    );
  });
});
