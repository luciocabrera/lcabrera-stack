import type {
  Outcome,
  RegressionConfig,
  TaskRunOutcomes,
} from './stats.types.ts';

import { countOutcomes } from './countOutcomes.util.ts';

type FlakyTasksArgs = {
  readonly config: RegressionConfig['flaky'];
  readonly history: readonly TaskRunOutcomes[];
};

const disagrees = (outcomes: readonly Outcome[]) => {
  const { k, n } = countOutcomes(outcomes);

  return k > 0 && k < n;
};

export const flakyTasks = ({
  config: { disagreeFraction, window },
  history,
}: FlakyTasksArgs) =>
  history
    .map(({ runs, taskKey }) => {
      const recent = runs.slice(-window);

      return {
        disagreeing: recent.filter((outcomes) => disagrees(outcomes)).length,
        runs: recent.length,
        taskKey,
      };
    })
    .filter(({ disagreeing, runs }) => disagreeing > disagreeFraction * runs);
