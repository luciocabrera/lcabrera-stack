import { selectRunSummaries } from '../.server/evalsHistory.service';
import { judgeMainRunPair } from '../.server/judgeMainRunPair.service';
import { requireEvalsDashboard } from '../.server/requireEvalsDashboard.service';
import { EVALS_RUNS_PER_SUITE } from '../constants/evalsDashboard.constants';
import { runFigures } from '../utils/runFigures.util';
import { mainRunPairs } from './mainRunPairs.util';
import { suiteRegressions } from './suiteRegressions.util';
import { toSuiteSummaries } from './toSuiteSummaries.util';

export const loader = async () => {
  requireEvalsDashboard();

  const runs = await selectRunSummaries({
    scope: { kind: 'recent', perSuite: EVALS_RUNS_PER_SUITE },
  });
  const figures = runs.map((run) => runFigures(run));
  const judged = await Promise.all(
    mainRunPairs(figures).map((pair) => judgeMainRunPair(pair)),
  );

  return {
    regressions: suiteRegressions(judged.filter((pair) => pair !== undefined)),
    suites: toSuiteSummaries(figures),
  };
};
