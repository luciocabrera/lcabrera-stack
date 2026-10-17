import type { LabelledRun } from './report.types.ts';

import { runLabel } from './runLabel.util.ts';

type SideLabelsArgs = {
  readonly a: LabelledRun;
  readonly b: LabelledRun;
};

export const sideLabels = ({ a, b }: SideLabelsArgs) =>
  a.branch === b.branch
    ? { a: runLabel(a), b: runLabel(b) }
    : { a: a.branch, b: b.branch };
