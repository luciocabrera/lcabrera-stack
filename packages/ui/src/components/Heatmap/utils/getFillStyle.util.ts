import type { HeatmapFill } from '#ui/components/Heatmap/Heatmap.types';

import { heatmapFill } from '#ui/components/Heatmap/Heatmap.stylex';
import { lineChartFill } from '#ui/components/LineChart/LineChart.stylex';

export const getFillStyle = (fill: HeatmapFill) => {
  if (fill.kind === 'empty') return heatmapFill.empty;

  return fill.kind === 'tone'
    ? lineChartFill[fill.tone]
    : heatmapFill.sequential(fill.percent);
};
