import type { ReportRun, ReportTask } from './report.types.ts';

export const reportTaskFixture = (overrides: Partial<ReportTask> = {}) =>
  ({
    outcomes: ['pass', 'pass', 'fail', 'error'],
    scores: [],
    set: 'regression',
    subject: { kind: 'skill', name: 'react-19' },
    taskHash: 't1',
    taskKey: 'skills/react-19/trigger-1',
    ...overrides,
  }) satisfies ReportTask;

export const reportRunFixture = (overrides: Partial<ReportRun> = {}) =>
  ({
    branch: 'main',
    catalogHash: 'cat1',
    costUsdReported: 1,
    durationsMs: [1000, 3000],
    gitSha: 'a'.repeat(40),
    harnessVersion: 'h1',
    modelId: 'model-a',
    runId: 'run-a',
    status: 'complete',
    subjects: [{ contentHash: 'c1', kind: 'skill', name: 'react-19' }],
    suite: 'skills',
    tasks: [reportTaskFixture()],
    ...overrides,
  }) satisfies ReportRun;
