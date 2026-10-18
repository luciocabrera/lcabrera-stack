import {
  selectFlakyTasks,
  selectRunSummaries,
  selectTaskTrials,
} from '../.server/evalsHistory.service';
import { requireEvalsDashboard } from '../.server/requireEvalsDashboard.service';
import { EVALS_FLAKY } from '../constants/evalsDashboard.constants';
import { runFigures } from '../utils/runFigures.util';
import { flakySuites } from './flakySuites.util';

export const loader = async () => {
  requireEvalsDashboard();

  const [flaky, runs] = await Promise.all([
    selectFlakyTasks(EVALS_FLAKY),
    selectRunSummaries({
      scope: { kind: 'recent', perSuite: EVALS_FLAKY.window },
    }),
  ]);
  const trials =
    flaky.length === 0
      ? []
      : await selectTaskTrials({
          runIds: runs.map(({ runId }) => runId),
          taskKeys: [...new Set(flaky.map(({ taskKey }) => taskKey))],
        });

  return {
    suites: flakySuites({
      flaky,
      runs: runs.map((run) => runFigures(run)),
      trials,
    }),
  };
};
