import type { Regression, SideLabels, Suite } from './report.types.ts';

import { flakyText } from './flakyText.util.ts';
import { ruleText } from './ruleText.util.ts';

type RegressionMarkdownArgs = {
  readonly labels: SideLabels;
  readonly minTrialsForRate: number;
  readonly regression: Regression;
  readonly suite: Suite;
};

export const regressionMarkdown = ({
  labels,
  minTrialsForRate,
  regression,
  suite,
}: RegressionMarkdownArgs) =>
  [
    ruleText({ labels, minTrialsForRate, rule: regression.rule, suite }),
    ...flakyText({ flaky: regression.flaky, labels }),
  ].join('\n\n');
