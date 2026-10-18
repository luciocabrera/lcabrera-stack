import { requireEvalsDashboard } from '../.server/requireEvalsDashboard.service';
import { selectJudgedMainPairs } from '../.server/selectJudgedMainPairs.service';
import { leftOutFlaky } from '../utils/leftOutFlaky.util';
import { suiteRegressions } from './suiteRegressions.util';
import { toSuiteSummaries } from './toSuiteSummaries.util';

export const loader = async () => {
  requireEvalsDashboard();

  const { figures, judged } = await selectJudgedMainPairs();

  return {
    regressions: suiteRegressions(judged),
    suites: toSuiteSummaries(figures).map((summary) => {
      const pair = judged.find(({ suite }) => suite === summary.suite);

      return {
        ...summary,
        flakyLeftOut:
          pair === undefined
            ? undefined
            : leftOutFlaky(pair.verdict).map(({ taskKey }) => taskKey),
      };
    }),
  };
};
