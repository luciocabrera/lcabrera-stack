import { EVALS_RUNS_PER_SUITE } from '../constants/evalsDashboard.constants';
import { mainRunPairs } from '../utils/mainRunPairs.util';
import { runFigures } from '../utils/runFigures.util';
import { selectRunSummaries } from './evalsHistory.service';
import { judgeMainRunPair } from './judgeMainRunPair.service';

export const selectJudgedMainPairs = async () => {
  const runs = await selectRunSummaries({
    scope: { kind: 'recent', perSuite: EVALS_RUNS_PER_SUITE },
  });
  const figures = runs.map((run) => runFigures(run));
  const judged = await Promise.all(
    mainRunPairs(figures).map((pair) => judgeMainRunPair(pair)),
  );

  return { figures, judged: judged.filter((pair) => pair !== undefined) };
};
