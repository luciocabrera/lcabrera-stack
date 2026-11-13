import { ChartSettings } from '#ui/components/ChartSettings/ChartSettings.component';
import { CHART_DEFAULT_DENSITY } from '#ui/components/ChartSettings/ChartSettings.constants';

import type { LineChartProps } from './LineChart.types';

import { LineChartFigure } from './LineChartFigure/LineChartFigure.component';
import { getLineChartInitialSettings } from './utils/getLineChartInitialSettings.util';

export const LineChart = ({
  density = CHART_DEFAULT_DENSITY,
  features,
  hasMarkerLabels,
  points,
  ...props
}: LineChartProps) => {
  const initialSettings = getLineChartInitialSettings({
    density,
    hasMarkerLabels,
    markers: props.markers,
    points,
    series: props.series,
    yAxis: props.yAxis,
  });

  if (features?.settings === false) {
    return <LineChartFigure {...props} settings={initialSettings} />;
  }

  return (
    <ChartSettings
      initialSettings={initialSettings}
      label={`Settings for ${props.title}`}
      renderChart={(settings) => (
        <LineChartFigure {...props} settings={settings} />
      )}
    />
  );
};
