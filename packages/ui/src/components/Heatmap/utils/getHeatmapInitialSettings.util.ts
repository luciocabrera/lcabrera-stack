import type { ChartDensity } from '#ui/components/ChartSettings/ChartSettings.types';

import type { HeatmapProps } from '../Heatmap.types';

type GetHeatmapInitialSettingsArgs = Pick<HeatmapProps, 'legend' | 'scale'> & {
  readonly density: ChartDensity;
};

export const getHeatmapInitialSettings = ({
  density,
  legend = [],
  scale,
}: GetHeatmapInitialSettingsArgs) => ({
  axisLabelStep: 1,
  density,
  hasLegend:
    legend.length === 0 && scale?.kind !== 'sequential' ? undefined : true,
  isDataTableVisible: false,
});
