import type { RegressionFinding } from '@repo/eval-history/stats/stats.types';

type Rate = Extract<RegressionFinding, { readonly kind: 'rate' }>['pr'];

const percent = (value: number) => `${String(Math.round(value * 100))}%`;

const rateText = (rate: Rate) =>
  rate.kind === 'rate'
    ? `${percent(rate.rate)} (${String(rate.k)}/${String(rate.n)})`
    : `${String(rate.k)}/${String(rate.n)}, too few trials for a rate`;

export const regressionFindingLabel = (finding: RegressionFinding) => {
  if (finding.kind === 'flip') {
    return `${finding.taskKey} failed ${String(finding.failed)} of ${String(finding.trials)} trials after passing every trial the run before`;
  }

  if (finding.kind === 'mean') {
    return `mean score ${finding.mean.toFixed(2)} fell below ${finding.threshold.toFixed(2)}`;
  }

  const bound =
    finding.main.kind === 'rate'
      ? `below ${percent(finding.main.lower)}, the lower bound of the run before at ${rateText(finding.main)}`
      : 'below the run before';

  return `pass rate ${rateText(finding.pr)} over its non-flaky regression tasks, ${bound}`;
};
