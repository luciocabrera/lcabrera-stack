import type { HeatmapCell } from '@lcabrera/ui/components/Heatmap';
import type { SubjectRun } from '@repo/eval-history/queries/queries.types';

import { evalsHref } from '../utils/evalsHref.util';
import { passRateLabel } from '../utils/passRateLabel.util';
import { rateFigures } from '../utils/rateFigures.util';
import { HEAT_TONES } from './EvalsHeatmap.constants';
import { heatTone } from './heatTone.util';

type HeatmapCellArgs = {
  readonly cell: SubjectRun;
  readonly flakyTasks: ReadonlySet<string>;
};

export const subjectKey = ({
  subjectKind,
  subjectName,
}: Pick<SubjectRun, 'subjectKind' | 'subjectName'>) =>
  `${subjectKind}/${subjectName}`;

export const heatmapCell = ({
  cell,
  flakyTasks,
}: HeatmapCellArgs): HeatmapCell => {
  const figures = rateFigures(cell);
  const isFlaky = cell.taskKeys.some((taskKey) =>
    flakyTasks.has(`${cell.suite}\n${taskKey}`),
  );

  return {
    column: cell.runId,
    label: `${cell.subjectName}, ${cell.startedAt.toISOString().slice(0, 10)}: ${passRateLabel(figures)}${isFlaky ? ', flaky' : ''}; open trial ${cell.trialId}`,
    row: subjectKey(cell),
    to: evalsHref({ runId: cell.runId, trialId: cell.trialId }),
    tone: HEAT_TONES[heatTone(figures.rate)],
    ...(isFlaky && { pattern: 'hatch' }),
  };
};
