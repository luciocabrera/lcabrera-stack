import type { ReportRun } from './report.types.ts';

type SharedTaskRunArgs = {
  readonly other: Pick<ReportRun, 'tasks'>;
  readonly run: ReportRun;
};

export const sharedTaskRun = ({ other, run }: SharedTaskRunArgs) => {
  const otherKeys = new Set(other.tasks.map(({ taskKey }) => taskKey));

  return {
    ...run,
    tasks: run.tasks.filter(({ taskKey }) => otherKeys.has(taskKey)),
  };
};
