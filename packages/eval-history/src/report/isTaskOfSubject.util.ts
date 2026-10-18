import type { ReportTask, TaskSubject } from './report.types.ts';

import { subjectKey } from './subjectKey.util.ts';

type IsTaskOfSubjectArgs = {
  readonly baselined: ReadonlySet<string>;
  readonly subject: TaskSubject | undefined;
  readonly task: Pick<ReportTask, 'subject'>;
};

export const isTaskOfSubject = ({
  baselined,
  subject,
  task,
}: IsTaskOfSubjectArgs) => {
  const key = subjectKey(task.subject);

  return subject === undefined
    ? baselined.size === 0 || baselined.has(key)
    : key === subjectKey(subject);
};
