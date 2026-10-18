import { binaryRegression } from '@repo/eval-history/stats/binaryRegression.util';

import type { FlakyTaskRow, TaskTrialsRow } from '../types/historyRows.types';
import type { MainRunPair, SuiteRegression } from './EvalsOverview.types';

import { EVALS_REGRESSION } from '../constants/evalsDashboard.constants';

type SuiteRegressionsArgs = {
  readonly flaky: readonly Pick<FlakyTaskRow, 'suite' | 'taskKey'>[];
  readonly pairs: readonly MainRunPair[];
  readonly trials: readonly TaskTrialsRow[];
};

export const suiteRegressions = ({
  flaky,
  pairs,
  trials,
}: SuiteRegressionsArgs) => {
  const sideOf = (runId: string) => {
    const rows = trials.filter((row) => row.runId === runId);
    const [first] = rows;

    return first === undefined
      ? undefined
      : {
          identity: {
            harnessVersion: first.harnessVersion,
            modelId: first.modelId,
          },
          tasks: rows.map(({ outcomes, taskKey, taskSet }) => ({
            outcomes,
            set: taskSet,
            taskKey,
          })),
        };
  };

  return pairs.flatMap((pair) => {
    const main = sideOf(pair.previous.runId);
    const pr = sideOf(pair.latest.runId);

    if (main === undefined || pr === undefined) {
      return [];
    }

    const flakyLeftOut = flaky
      .filter(({ suite }) => suite === pair.suite)
      .map(({ taskKey }) => taskKey);
    const verdict = binaryRegression({
      config: EVALS_REGRESSION,
      flaky: flakyLeftOut,
      main,
      pr,
    });

    if (verdict.kind !== 'regression') {
      return [];
    }

    const regression: SuiteRegression = {
      ...pair,
      findings: verdict.findings,
      flakyLeftOut,
    };

    return [regression];
  });
};
