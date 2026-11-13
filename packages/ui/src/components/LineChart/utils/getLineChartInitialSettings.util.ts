import type { ChartDensity } from '#ui/components/ChartSettings/ChartSettings.types';
import type { LineChartProps } from '#ui/components/LineChart/LineChart.types';

import { LINE_CHART } from '#ui/components/LineChart/LineChart.constants';

type GetLineChartInitialSettingsArgs = Pick<
  LineChartProps,
  'hasMarkerLabels' | 'markers' | 'points' | 'series' | 'yAxis'
> & {
  readonly density: ChartDensity;
};

export const getLineChartInitialSettings = ({
  density,
  hasMarkerLabels = true,
  markers = [],
  points = 'auto',
  series,
  yAxis,
}: GetLineChartInitialSettingsArgs) => ({
  density,
  hasLegend: series.length > 1 ? true : undefined,
  hasMarkerLabels: markers.length === 0 ? undefined : hasMarkerLabels,
  isDataTableVisible: false,
  points,
  tickCount: yAxis?.ticks === undefined ? LINE_CHART.tickCount : undefined,
});
