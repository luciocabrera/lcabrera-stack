import type { TaskSubject } from './report.types.ts';

import { codeSpan } from './codeSpan.util.ts';

export const subjectText = (subject: TaskSubject | undefined) =>
  subject === undefined
    ? 'the suite as a whole'
    : `${subject.kind} ${codeSpan(subject.name)}`;
