import { selectRunSummaries } from '../.server/evalsHistory.service';
import { requireEvalsDashboard } from '../.server/requireEvalsDashboard.service';
import { EVALS_RUNS_PER_SUITE } from '../constants/evalsDashboard.constants';
import { runFigures } from '../utils/runFigures.util';
import { suiteRegressions } from './suiteRegressions.util';
import { toSuiteSummaries } from './toSuiteSummaries.util';

export const loader = async () => {
  requireEvalsDashboard();

  const runs = await selectRunSummaries({
    scope: { kind: 'recent', perSuite: EVALS_RUNS_PER_SUITE },
  });
  const figures = runs.map((run) => runFigures(run));

  return {
    regressions: suiteRegressions(figures),
    suites: toSuiteSummaries(figures),
  };
};
