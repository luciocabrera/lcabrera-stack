import type { ReportRun } from './report.types.ts';

type NarrowRunArgs = {
  readonly run: ReportRun;
  readonly subjects: readonly string[];
};

export const narrowRun = ({ run, subjects }: NarrowRunArgs) => {
  if (subjects.length === 0) {
    return run;
  }

  const names = new Set(subjects);

  return {
    ...run,
    subjects: run.subjects.filter(({ name }) => names.has(name)),
    tasks: run.tasks.filter(({ subject }) => names.has(subject.name)),
  };
};
