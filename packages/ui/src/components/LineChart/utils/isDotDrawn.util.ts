import type {
  ChartPoint,
  LineChartPointsMode,
} from '#ui/components/LineChart/LineChart.types';

import { LINE_CHART } from '#ui/components/LineChart/LineChart.constants';

type IsDotDrawnArgs = {
  readonly drawnCount: number;
  readonly mode: LineChartPointsMode;
  readonly point: ChartPoint;
};

export const isDotDrawn = ({ drawnCount, mode, point }: IsDotDrawnArgs) => {
  if (mode === 'always' || point.to !== undefined) return true;

  return (
    mode === 'auto' &&
    (point.tone !== undefined || drawnCount <= LINE_CHART.autoDotLimit)
  );
};
