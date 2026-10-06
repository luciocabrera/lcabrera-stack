import type { RegressionConfig, TaskTrials } from './stats.types.ts';

import { countOutcomes } from './countOutcomes.util.ts';
import { hasPassHatK } from './hasPassHatK.util.ts';

type FlippedArgs = {
  readonly flip: RegressionConfig['binary']['flip'];
  readonly main: readonly TaskTrials[];
  readonly pr: TaskTrials;
};

export const flipped = ({ flip, main, pr }: FlippedArgs) => {
  const before = main.find(({ taskKey }) => taskKey === pr.taskKey);
  const { k, n } = countOutcomes(pr.outcomes);
  const failed = n - k;
  const passedOnMain = before !== undefined && hasPassHatK(before.outcomes);
  const isFailedOnPr =
    n >= flip.ofTrials && failed * flip.ofTrials >= flip.failAtLeast * n;

  if (!passedOnMain || !isFailedOnPr) {
    return;
  }

  return { failed, kind: 'flip', taskKey: pr.taskKey, trials: n } as const;
};
