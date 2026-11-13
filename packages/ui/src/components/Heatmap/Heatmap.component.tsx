import { ChartSettings } from '#ui/components/ChartSettings/ChartSettings.component';
import { CHART_DEFAULT_DENSITY } from '#ui/components/ChartSettings/ChartSettings.constants';

import type { HeatmapProps } from './Heatmap.types';

import { HeatmapFigure } from './HeatmapFigure/HeatmapFigure.component';
import { getHeatmapInitialSettings } from './utils/getHeatmapInitialSettings.util';

export const Heatmap = ({
  density = CHART_DEFAULT_DENSITY,
  features,
  ...props
}: HeatmapProps) => {
  const initialSettings = getHeatmapInitialSettings({
    density,
    legend: props.legend,
    scale: props.scale,
  });

  if (features?.settings === false) {
    return <HeatmapFigure {...props} settings={initialSettings} />;
  }

  return (
    <ChartSettings
      initialSettings={initialSettings}
      label={`Settings for ${props.title}`}
      renderChart={(settings) => (
        <HeatmapFigure {...props} settings={settings} />
      )}
    />
  );
};
