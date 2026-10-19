import type { RuleFinding } from '@repo/eval-history/report/report.types';

import { EVALS_SCORED } from '../constants/evalsDashboard.constants';

type Rate = Extract<RuleFinding, { readonly kind: 'rate' }>['pr'];

type SubjectFinding = Extract<RuleFinding, { readonly kind: 'flip' | 'mean' }>;

const percent = (value: number) => `${String(Math.round(value * 100))}%`;

const rateText = (rate: Rate) =>
  rate.kind === 'rate'
    ? `${percent(rate.rate)} (${String(rate.k)}/${String(rate.n)})`
    : `${String(rate.k)}/${String(rate.n)}, too few trials for a rate`;

const subjectLabel = ({ subject }: SubjectFinding) =>
  subject === undefined
    ? 'the suite as a whole'
    : `${subject.kind} ${subject.name}`;

export const regressionFindingLabel = (finding: RuleFinding) => {
  if (finding.kind === 'flip') {
    return `${subjectLabel(finding)}: ${finding.taskKey} failed ${String(finding.failed)} of ${String(finding.trials)} trials after passing every trial the run before`;
  }

  if (finding.kind === 'mean') {
    return `${subjectLabel(finding)}: mean judge score ${finding.mean.toFixed(2)}, below ${finding.threshold.toFixed(2)}, the baseline mean less ${String(EVALS_SCORED.sigma)} standard deviations`;
  }

  const bound =
    finding.main.kind === 'rate'
      ? `below ${percent(finding.main.lower)}, the lower bound of the run before at ${rateText(finding.main)}`
      : 'below the run before';

  return `the suite pass rate ${rateText(finding.pr)} over its non-flaky regression tasks, ${bound}`;
};

export const regressionFindingKey = (finding: RuleFinding) => {
  if (finding.kind === 'rate') {
    return 'rate';
  }

  const subject =
    finding.subject === undefined
      ? 'suite'
      : `${finding.subject.kind}/${finding.subject.name}`;

  return finding.kind === 'flip'
    ? `flip:${subject}:${finding.taskKey}`
    : `mean:${subject}`;
};
