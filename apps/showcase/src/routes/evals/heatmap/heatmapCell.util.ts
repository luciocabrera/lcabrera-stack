import type { SubjectRun } from '@repo/eval-history/queries/queries.types';

import { evalsHref } from '../utils/evalsHref.util';
import { passRateLabel } from '../utils/passRateLabel.util';
import { rateFigures } from '../utils/rateFigures.util';
import { heatTone } from './heatTone.util';

type HeatmapCellArgs = {
  readonly cell: SubjectRun;
  readonly flakyTasks: ReadonlySet<string>;
};

export const heatmapCell = ({ cell, flakyTasks }: HeatmapCellArgs) => {
  const figures = rateFigures(cell);
  const isFlaky = cell.taskKeys.some((taskKey) =>
    flakyTasks.has(`${cell.suite}\n${taskKey}`),
  );

  return {
    href: evalsHref({ runId: cell.runId, trialId: cell.trialId }),
    isFlaky,
    key: `${cell.subjectKind}/${cell.subjectName}/${cell.runId}`,
    label: `${cell.subjectName}, ${cell.startedAt.toISOString().slice(0, 10)}: ${passRateLabel(figures)}${isFlaky ? ', flaky' : ''}; open trial ${cell.trialId}`,
    tone: heatTone(figures.rate),
  };
};
