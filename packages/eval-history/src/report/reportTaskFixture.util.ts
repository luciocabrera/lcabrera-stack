import type { ReportTask } from './report.types.ts';

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
