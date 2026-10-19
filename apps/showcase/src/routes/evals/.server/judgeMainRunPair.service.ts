import { regressionVerdict } from '@repo/eval-history/report/regressionVerdict.util';

import type { MainRunPair } from '../overview/EvalsOverview.types';

import { EVALS_REGRESSION } from '../constants/evalsDashboard.constants';
import { selectReportRun, selectRuleHistory } from './evalsHistory.service';

export const judgeMainRunPair = async (pair: MainRunPair) => {
  const [a, b] = await Promise.all([
    selectReportRun({ runId: pair.previous.runId }),
    selectReportRun({ runId: pair.latest.runId }),
  ]);

  if (a === undefined || b === undefined) {
    return;
  }

  const history = await selectRuleHistory({
    config: EVALS_REGRESSION,
    excludedRuns: [a.runId, b.runId],
    run: b,
  });

  return {
    ...pair,
    verdict: regressionVerdict({
      a,
      allowHarnessChange: false,
      b,
      config: EVALS_REGRESSION,
      history,
    }),
  };
};
