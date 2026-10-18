import type { RuleFinding } from './report.types.ts';

import { subjectText } from './subjectText.util.ts';

export const findingSubject = (finding: RuleFinding) =>
  finding.kind === 'rate'
    ? 'the suite pass rate'
    : subjectText(finding.subject);
