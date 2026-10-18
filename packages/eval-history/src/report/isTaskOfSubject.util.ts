import type { ReportTask, TaskSubject } from './report.types.ts';

import { subjectKey } from './subjectKey.util.ts';

type IsTaskOfSubjectArgs = {
  readonly subject: TaskSubject | undefined;
  readonly task: Pick<ReportTask, 'subject'>;
};

export const isTaskOfSubject = ({ subject, task }: IsTaskOfSubjectArgs) =>
  subject === undefined || subjectKey(task.subject) === subjectKey(subject);
