import type { RunFigures } from '../types/runFigures.types';
import type { SuiteRegression } from './EvalsOverview.types';

const MAIN_BRANCH = 'main';

export const suiteRegressions = (runs: readonly RunFigures[]) => {
  const mainRuns = runs.filter(({ branch }) => branch === MAIN_BRANCH);
  const suites = [...new Set(mainRuns.map(({ suite }) => suite))];

  return suites.flatMap((suite) => {
    const [latest, previous] = mainRuns.filter((run) => run.suite === suite);

    if (
      latest?.rate === undefined ||
      previous?.lower === undefined ||
      latest.rate >= previous.lower
    ) {
      return [];
    }

    const regression: SuiteRegression = { latest, previous, suite };

    return [regression];
  });
};
