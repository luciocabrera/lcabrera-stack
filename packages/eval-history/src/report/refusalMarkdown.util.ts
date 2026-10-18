import type { Refusal } from './report.types.ts';

import { refusalText } from './refusalText.util.ts';
import { regressionMarkdown } from './regressionMarkdown.util.ts';
import { sideLabels } from './sideLabels.util.ts';

type RefusalMarkdownArgs = {
  readonly minTrialsForRate: number;
  readonly refusal: Refusal;
};

export const refusalMarkdown = ({
  minTrialsForRate,
  refusal,
}: RefusalMarkdownArgs) => {
  const labels = sideLabels(refusal);

  return [
    `### ${refusal.suite}: ${labels.a} → ${labels.b}: not compared`,
    refusalText(refusal),
    ...(refusal.regression?.rule.kind === 'no-baseline'
      ? [
          regressionMarkdown({
            labels,
            minTrialsForRate,
            regression: refusal.regression,
            suite: refusal.suite,
          }),
        ]
      : []),
  ].join('\n\n');
};
