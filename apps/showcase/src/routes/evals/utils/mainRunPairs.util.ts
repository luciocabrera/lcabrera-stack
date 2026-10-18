import type { MainRunPair } from '../overview/EvalsOverview.types';
import type { RunFigures } from '../types/runFigures.types';

import { EVALS_MAIN_BRANCH } from '../constants/evalsDashboard.constants';

export const mainRunPairs = (runs: readonly RunFigures[]) => {
  const mainRuns = runs.filter(({ branch }) => branch === EVALS_MAIN_BRANCH);
  const suites = [...new Set(mainRuns.map(({ suite }) => suite))];

  return suites.flatMap((suite) => {
    const [latest, previous] = mainRuns.filter((run) => run.suite === suite);

    if (latest === undefined || previous === undefined) {
      return [];
    }

    const pair: MainRunPair = { latest, previous, suite };

    return [pair];
  });
};
