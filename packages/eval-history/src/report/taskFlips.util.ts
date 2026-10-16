import type { ReportRun, TaskFlip } from './report.types.ts';

import { compareCodeUnits } from '../hashing/compareCodeUnits.util.ts';
import { isFlip } from './isFlip.util.ts';
import { outcomesByTask } from './outcomesByTask.util.ts';
import { taskCount } from './taskCount.util.ts';

type TaskFlipsArgs = {
  readonly a: ReportRun;
  readonly b: ReportRun;
};

export const taskFlips = ({ a, b }: TaskFlipsArgs) => {
  const before = outcomesByTask(a);
  const after = outcomesByTask(b);

  return [...new Set([...before.keys(), ...after.keys()])]
    .toSorted(compareCodeUnits)
    .filter((taskKey) =>
      isFlip({ after: after.get(taskKey), before: before.get(taskKey) }),
    )
    .map((taskKey): TaskFlip => ({
      a: taskCount(before.get(taskKey)),
      b: taskCount(after.get(taskKey)),
      taskKey,
    }));
};
