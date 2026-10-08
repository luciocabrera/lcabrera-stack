import type { Outcome } from '../stats/stats.types.ts';
import type { ReportRun, TaskFlip } from './report.types.ts';

import { compareCodeUnits } from '../hashing/compareCodeUnits.util.ts';
import { countOutcomes } from '../stats/countOutcomes.util.ts';
import { hasPassAtK } from '../stats/hasPassAtK.util.ts';
import { hasPassHatK } from '../stats/hasPassHatK.util.ts';

type TaskFlipsArgs = {
  readonly a: ReportRun;
  readonly b: ReportRun;
};

const outcomesByTask = ({ tasks }: ReportRun) =>
  new Map(tasks.map(({ outcomes, taskKey }) => [taskKey, outcomes]));

type IsFlipArgs = {
  readonly after: readonly Outcome[] | undefined;
  readonly before: readonly Outcome[] | undefined;
};

const isFlip = ({ after, before }: IsFlipArgs) =>
  before === undefined ||
  after === undefined ||
  hasPassAtK(before) !== hasPassAtK(after) ||
  hasPassHatK(before) !== hasPassHatK(after);

const countOf = (outcomes: readonly Outcome[] | undefined) =>
  outcomes === undefined ? undefined : countOutcomes(outcomes);

export const taskFlips = ({ a, b }: TaskFlipsArgs) => {
  const before = outcomesByTask(a);
  const after = outcomesByTask(b);

  return [...new Set([...before.keys(), ...after.keys()])]
    .toSorted(compareCodeUnits)
    .filter((taskKey) =>
      isFlip({ after: after.get(taskKey), before: before.get(taskKey) }),
    )
    .map((taskKey): TaskFlip => ({
      a: countOf(before.get(taskKey)),
      b: countOf(after.get(taskKey)),
      taskKey,
    }));
};
