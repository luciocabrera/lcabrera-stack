import { countOutcomes } from '@repo/eval-history/stats/countOutcomes.util';

import type { FlakyTaskRow, TaskTrialsRow } from '../types/historyRows.types';
import type { RunFigures } from '../types/runFigures.types';

import { evalsHref } from '../utils/evalsHref.util';
import { taskTally } from '../utils/taskTally.util';

type FlakySuitesArgs = {
  readonly flaky: readonly FlakyTaskRow[];
  readonly runs: readonly RunFigures[];
  readonly trials: readonly TaskTrialsRow[];
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

export const flakySuites = ({ flaky, runs, trials }: FlakySuitesArgs) => {
  const suites = [...new Set(runs.map(({ suite }) => suite))];

  return suites.map((suite) => {
    const suiteRuns = runs.filter((run) => run.suite === suite).toReversed();

    return {
      runs: suiteRuns.map(({ runId, startedAt }) => ({
        href: evalsHref({ runId }),
        label: startedAt.slice(0, 10),
        runId,
      })),
      suite,
      tasks: flaky
        .filter((task) => task.suite === suite)
        .map(({ disagreeing, runs: judgedRuns, taskKey }) => ({
          cells: suiteRuns.map((run) =>
            splitCell({
              row: trials.find(
                (trial) =>
                  trial.runId === run.runId && trial.taskKey === taskKey,
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
