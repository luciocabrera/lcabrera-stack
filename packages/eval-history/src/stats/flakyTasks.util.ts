import type { RegressionConfig, TaskRunOutcomes } from './stats.types.ts';

import { hasDisagreement } from './hasDisagreement.util.ts';

type FlakyTasksArgs = {
  readonly config: RegressionConfig['flaky'];
  readonly history: readonly TaskRunOutcomes[];
};

export const flakyTasks = ({
  config: { disagreeFraction, window },
  history,
}: FlakyTasksArgs) =>
  history
    .map(({ runs, taskKey }) => {
      const recent = runs.slice(-window);

      return {
        disagreeing: recent.filter((outcomes) => hasDisagreement(outcomes))
          .length,
        runs: recent.length,
        taskKey,
      };
    })
    .filter(({ disagreeing, runs }) => disagreeing > disagreeFraction * runs);
