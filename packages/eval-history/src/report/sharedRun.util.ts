import type { ReportRun } from './report.types.ts';

import { subjectKey } from './subjectKey.util.ts';

type SharedRunArgs = {
  readonly other: Pick<ReportRun, 'subjects' | 'tasks'>;
  readonly run: ReportRun;
};

export const sharedRun = ({ other, run }: SharedRunArgs) => {
  const otherTasks = new Set(other.tasks.map(({ taskKey }) => taskKey));
  const otherSubjects = new Set(
    other.subjects.map((subject) => subjectKey(subject)),
  );

  return {
    ...run,
    subjects: run.subjects.filter((subject) =>
      otherSubjects.has(subjectKey(subject)),
    ),
    tasks: run.tasks.filter(({ taskKey }) => otherTasks.has(taskKey)),
  };
};
