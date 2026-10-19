import type { readReportRun } from '@repo/eval-history/report/readReportRun.service';
import type { RuleHistory } from '@repo/eval-history/report/report.types';

type ReportRunArgs = Partial<Pick<StoredRun, 'modelId'>> &
  Pick<StoredRun, 'runId' | 'tasks'>;

type ReportTaskArgs = Partial<Pick<StoredTask, 'set'>> &
  Pick<StoredTask, 'outcomes' | 'taskKey'>;

type StoredRun = NonNullable<Awaited<ReturnType<typeof readReportRun>>>;

type StoredTask = StoredRun['tasks'][number];

export const reportTask = ({
  outcomes,
  set = 'regression',
  taskKey,
}: ReportTaskArgs): StoredTask => ({
  agentPromptHash: undefined,
  expectedHash: undefined,
  fixtureHash: undefined,
  judgePromptHash: undefined,
  outcomes,
  scores: [],
  set,
  subject: { kind: 'skill', name: taskKey.split('/', 2)[1] ?? taskKey },
  taskHash: 't'.repeat(64),
  taskKey,
});

export const reportRun = ({
  modelId = 'model-a',
  runId,
  tasks,
}: ReportRunArgs): StoredRun => ({
  branch: 'main',
  catalogHash: undefined,
  costUsdReported: undefined,
  durationsMs: [],
  gitSha: 'a'.repeat(40),
  harnessVersion: 'abcdefabcdef',
  modelId,
  runId,
  status: 'complete',
  subjects: [...new Set(tasks.map(({ subject }) => subject.name))].map(
    (name) => ({ contentHash: 'c'.repeat(64), kind: 'skill', name }),
  ),
  suite: 'skills',
  tasks,
});

type ReadHistory = Extract<RuleHistory, { readonly kind: 'read' }>;

export const ruleHistory = (flaky: ReadHistory['flaky']): ReadHistory => ({
  baseline: {
    kind: 'rows',
    rows: [
      {
        baselineId: '00000000-0000-4000-8000-0000000000ff',
        gitSha: 'b'.repeat(40),
        harnessVersion: 'abcdefabcdef',
        mean: 0.9,
        metric: 'pass_rate',
        modelId: 'model-a',
        nRuns: 5,
        stddev: 0.05,
        subject: undefined,
        suite: 'skills',
      },
    ],
  },
  flaky,
  kind: 'read',
});
