import type { ReportRun, RuleHistory, SidePair } from './report.types.ts';

import { outcomesByTask } from './outcomesByTask.util.ts';
import { taskCount } from './taskCount.util.ts';

type FlakyListingArgs = SidePair<Pick<ReportRun, 'tasks'>> & {
  readonly rows: Extract<RuleHistory, { readonly kind: 'read' }>['flaky'];
};

export const flakyListing = ({ a, b, rows }: FlakyListingArgs) => {
  const before = outcomesByTask(a);
  const after = outcomesByTask(b);

  return rows
    .filter(({ taskKey }) => before.has(taskKey) || after.has(taskKey))
    .map(({ disagreeing, runs, taskKey }) => ({
      a: taskCount(before.get(taskKey)),
      b: taskCount(after.get(taskKey)),
      disagreeing,
      runs,
      taskKey,
    }));
};
