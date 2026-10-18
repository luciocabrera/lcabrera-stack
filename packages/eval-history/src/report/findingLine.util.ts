import type { RuleFinding, SideLabels } from './report.types.ts';

import { formatPercent } from '../grades/formatPercent.util.ts';
import { codeSpan } from './codeSpan.util.ts';
import { subjectText } from './subjectText.util.ts';

type FindingLineArgs = {
  readonly finding: RuleFinding;
  readonly labels: SideLabels;
};

export const findingLine = ({ finding, labels }: FindingLineArgs) => {
  if (finding.kind === 'rate') {
    return finding.main.kind === 'rate' && finding.pr.kind === 'rate'
      ? `- the suite pass rate: ${formatPercent(finding.pr.rate)} on ${labels.b}, below ${formatPercent(finding.main.lower)}, the lower bound of ${labels.a}'s Wilson interval`
      : '- the suite pass rate';
  }

  return finding.kind === 'flip'
    ? `- ${subjectText(finding.subject)}: ${codeSpan(finding.taskKey)} failed ${String(finding.failed)} of ${String(finding.trials)} counted trials on ${labels.b} after passing every trial on ${labels.a}`
    : `- ${subjectText(finding.subject)}: mean judge score ${finding.mean.toFixed(2)} on ${labels.b}, below ${finding.threshold.toFixed(2)}, the baseline mean less \`scored.sigma\` standard deviations`;
};
