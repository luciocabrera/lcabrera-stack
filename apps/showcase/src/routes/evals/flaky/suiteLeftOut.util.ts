import type { JudgedRunPair } from '../overview/EvalsOverview.types';
import type { FlakyTaskRow } from '../types/historyRows.types';
import type { RunFigures } from '../types/runFigures.types';

import { evalsHref } from '../utils/evalsHref.util';
import { leftOutFlaky } from '../utils/leftOutFlaky.util';
import { runWhenLabel } from '../utils/runWhenLabel.util';

type SuiteLeftOutArgs = {
  readonly judged: readonly JudgedRunPair[];
  readonly suite: string;
  readonly unexcluded: readonly FlakyTaskRow[];
};

const runLink = (run: RunFigures) => ({
  href: evalsHref({ runId: run.runId }),
  label: runWhenLabel(run),
});

export const suiteLeftOut = ({
  judged,
  suite,
  unexcluded,
}: SuiteLeftOutArgs) => {
  const pair = judged.find((candidate) => candidate.suite === suite);

  if (pair === undefined) {
    return {
      basis: { kind: 'all-runs' } as const,
      tasks: unexcluded
        .filter((task) => task.suite === suite)
        .map(({ disagreeing, runs, taskKey }) => ({
          disagreeing,
          runs,
          taskKey,
        })),
    };
  }

  return {
    basis: {
      kind: 'pair',
      latest: runLink(pair.latest),
      previous: runLink(pair.previous),
    } as const,
    tasks: leftOutFlaky(pair.verdict),
  };
};
