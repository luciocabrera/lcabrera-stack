import { countOutcomes } from '@repo/eval-history/stats/countOutcomes.util';

import type { JudgedRunPair } from '../overview/EvalsOverview.types';
import type { FlakyTaskRow, TaskTrialsRow } from '../types/historyRows.types';
import type { RunFigures } from '../types/runFigures.types';

import { evalsHref } from '../utils/evalsHref.util';
import { taskTally } from '../utils/taskTally.util';
import { suiteLeftOut } from './suiteLeftOut.util';

type FlakySuitesArgs = {
  readonly judged: readonly JudgedRunPair[];
  readonly runs: readonly RunFigures[];
  readonly trials: readonly TaskTrialsRow[];
  readonly unexcluded: readonly FlakyTaskRow[];
};

type SplitCellArgs = {
  readonly row: TaskTrialsRow | undefined;
  readonly run: RunFigures;
};

const splitCell = ({ row, run }: SplitCellArgs) => {
  const href = evalsHref({ runId: run.runId });

  if (row === undefined) {
    return { href, isSplit: false, label: 'not run', runId: run.runId };
  }

  const { k, n } = countOutcomes(row.outcomes);

  return {
    href,
    isSplit: k > 0 && k < n,
    label: taskTally({ k, n, outcomes: row.outcomes }),
    runId: run.runId,
  };
};

export const flakySuites = ({
  judged,
  runs,
  trials,
  unexcluded,
}: FlakySuitesArgs) => {
  const suites = [...new Set(runs.map(({ suite }) => suite))];

  return suites.map((suite) => {
    const suiteRuns = runs.filter((run) => run.suite === suite).toReversed();
    const { basis, tasks } = suiteLeftOut({ judged, suite, unexcluded });

    return {
      basis,
      runs: suiteRuns.map(({ runId, startedAt }) => ({
        href: evalsHref({ runId }),
        label: startedAt.slice(0, 10),
        runId,
      })),
      suite,
      tasks: tasks.map(({ disagreeing, runs: judgedRuns, taskKey }) => ({
        cells: suiteRuns.map((run) =>
          splitCell({
            row: trials.find(
              (trial) => trial.runId === run.runId && trial.taskKey === taskKey,
            ),
            run,
          }),
        ),
        disagreeing,
        runs: judgedRuns,
        taskKey,
      })),
    };
  });
};
