import { scaleLinear } from '@lcabrera/utils/chart/scale-linear.util';
import { isFiniteNumber } from '@lcabrera/utils/guards/is-finite-number.util';

import type {
  HeatmapCell,
  HeatmapFill,
  HeatmapScale,
} from '#ui/components/Heatmap/Heatmap.types';

import { HEATMAP_DEFAULT_TONE } from '#ui/components/Heatmap/Heatmap.constants';

type GetCellFillArgs = {
  readonly cell: HeatmapCell | undefined;
  readonly scale: HeatmapScale | undefined;
};

export const getCellFill = ({ cell, scale }: GetCellFillArgs): HeatmapFill => {
  if (cell === undefined) return { kind: 'empty' };

  if (scale?.kind === 'sequential' && isFiniteNumber(cell.value)) {
    const toPercent = scaleLinear({
      domain: scale.domain,
      isClamped: true,
      range: [0, 100],
    });

    return { kind: 'sequential', percent: `${String(toPercent(cell.value))}%` };
  }

  return { kind: 'tone', tone: cell.tone ?? HEATMAP_DEFAULT_TONE };
};
