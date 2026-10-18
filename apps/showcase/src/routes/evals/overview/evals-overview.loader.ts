import {
  selectFlakyTasks,
  selectRunSummaries,
  selectTaskTrials,
} from '../.server/evalsHistory.service';
import { requireEvalsDashboard } from '../.server/requireEvalsDashboard.service';
import {
  EVALS_FLAKY,
  EVALS_RUNS_PER_SUITE,
} from '../constants/evalsDashboard.constants';
import { runFigures } from '../utils/runFigures.util';
import { mainRunPairs } from './mainRunPairs.util';
import { suiteRegressions } from './suiteRegressions.util';
import { toSuiteSummaries } from './toSuiteSummaries.util';

export const loader = async () => {
  requireEvalsDashboard();

  const [runs, flaky] = await Promise.all([
    selectRunSummaries({
      scope: { kind: 'recent', perSuite: EVALS_RUNS_PER_SUITE },
    }),
    selectFlakyTasks(EVALS_FLAKY),
  ]);
  const figures = runs.map((run) => runFigures(run));
  const pairs = mainRunPairs(figures);
  const trials = await selectTaskTrials({
    runIds: pairs.flatMap(({ latest, previous }) => [
      latest.runId,
      previous.runId,
    ]),
  });

  return {
    regressions: suiteRegressions({ flaky, pairs, trials }),
    suites: toSuiteSummaries(figures),
  };
};
