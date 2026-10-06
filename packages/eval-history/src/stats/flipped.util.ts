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

  if (before === undefined || !hasPassHatK(before.outcomes)) {
    return;
  }

  const { k, n } = countOutcomes(pr.outcomes);
  const failed = n - k;
  const missing = Math.max(0, flip.ofTrials - n);

  if (missing > 0 && failed < flip.failAtLeast) {
    return failed + missing >= flip.failAtLeast
      ? ({
          failed,
          kind: 'insufficient',
          taskKey: pr.taskKey,
          trials: n,
        } as const)
      : undefined;
  }

  return failed * flip.ofTrials >= flip.failAtLeast * n
    ? ({ failed, kind: 'flip', taskKey: pr.taskKey, trials: n } as const)
    : undefined;
};
