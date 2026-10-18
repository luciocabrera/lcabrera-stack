import type { Regression, SideLabels } from './report.types.ts';

import { codeSpan } from './codeSpan.util.ts';
import { flipCell } from './flipCell.util.ts';

type FlakyTextArgs = {
  readonly flaky: Regression['flaky'];
  readonly labels: SideLabels;
};

export const flakyText = ({ flaky, labels }: FlakyTextArgs) =>
  flaky.length === 0
    ? []
    : [
        [
          'Flaky, left out of the rule:',
          ...flaky.map(
            ({ a, b, disagreeing, runs, taskKey }) =>
              `- ${codeSpan(taskKey)}: ${labels.a} ${flipCell(a)}, ${labels.b} ${flipCell(b)}; its trials disagreed in ${String(disagreeing)} of its last ${String(runs)} runs`,
          ),
        ].join('\n'),
      ];
