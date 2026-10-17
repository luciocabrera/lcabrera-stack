import type { compareSelection } from '../compare/compareSelection.util';

import { EVALS_MAIN_BRANCH } from '../constants/evalsDashboard.constants';
import { selectRunSummaries } from './evalsHistory.service';

type Selection = Exclude<
  ReturnType<typeof compareSelection>,
  { readonly kind: 'invalid' | 'pick' }
>;

const selectBranchPair = async ({
  branch,
  suite,
}: Extract<Selection, { readonly kind: 'branch' }>) => {
  const [heads, mains] = await Promise.all([
    selectRunSummaries({ scope: { branch, kind: 'recent', perSuite: 1 } }),
    selectRunSummaries({
      scope: { branch: EVALS_MAIN_BRANCH, kind: 'recent', perSuite: 2 },
    }),
  ]);
  const b = heads
    .filter((run) => suite === undefined || run.suite === suite)
    .toSorted(
      (left, right) => right.startedAt.getTime() - left.startedAt.getTime(),
    )
    .at(0);
  const a = mains.find(
    (run) => run.suite === b?.suite && run.runId !== b.runId,
  );

  return a === undefined || b === undefined ? undefined : { a, b };
};

export const selectComparedRuns = async (selection: Selection) => {
  if (selection.kind === 'branch') {
    return selectBranchPair(selection);
  }

  const [[a], [b]] = await Promise.all([
    selectRunSummaries({ scope: { kind: 'run', runId: selection.a } }),
    selectRunSummaries({ scope: { kind: 'run', runId: selection.b } }),
  ]);

  return a === undefined || b === undefined ? undefined : { a, b };
};
