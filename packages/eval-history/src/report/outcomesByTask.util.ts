import type { ReportRun } from './report.types.ts';

export const outcomesByTask = ({ tasks }: Pick<ReportRun, 'tasks'>) =>
  new Map(tasks.map(({ outcomes, taskKey }) => [taskKey, outcomes]));
