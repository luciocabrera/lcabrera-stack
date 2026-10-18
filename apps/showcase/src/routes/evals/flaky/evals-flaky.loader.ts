import {
  selectFlakyTasks,
  selectRunSummaries,
  selectTaskTrials,
} from '../.server/evalsHistory.service';
import { requireEvalsDashboard } from '../.server/requireEvalsDashboard.service';
import { selectJudgedMainPairs } from '../.server/selectJudgedMainPairs.service';
import { EVALS_FLAKY } from '../constants/evalsDashboard.constants';
import { runFigures } from '../utils/runFigures.util';
import { flakySuites } from './flakySuites.util';

export const loader = async () => {
  requireEvalsDashboard();

  const [{ judged }, summaries, unexcluded] = await Promise.all([
    selectJudgedMainPairs(),
    selectRunSummaries({
      scope: { kind: 'recent', perSuite: EVALS_FLAKY.window },
    }),
    selectFlakyTasks(EVALS_FLAKY),
  ]);
  const runs = summaries.map((run) => runFigures(run));
  const listed = flakySuites({ judged, runs, trials: [], unexcluded });
  const taskKeys = [
    ...new Set(
      listed.flatMap(({ tasks }) => tasks.map(({ taskKey }) => taskKey)),
    ),
  ];

  if (taskKeys.length === 0) {
    return { suites: listed };
  }

  const trials = await selectTaskTrials({
    runIds: runs.map(({ runId }) => runId),
    taskKeys,
  });

  return { suites: flakySuites({ judged, runs, trials, unexcluded }) };
};
