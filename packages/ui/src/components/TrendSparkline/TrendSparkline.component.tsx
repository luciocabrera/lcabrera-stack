import { ChartSettings } from '#ui/components/ChartSettings/ChartSettings.component';
import { CHART_DEFAULT_DENSITY } from '#ui/components/ChartSettings/ChartSettings.constants';

import type { TrendSparklineProps } from './TrendSparkline.types';

import { TrendSparklineFigure } from './TrendSparklineFigure/TrendSparklineFigure.component';

export const TrendSparkline = ({
  density = CHART_DEFAULT_DENSITY,
  features,
  ...props
}: TrendSparklineProps) => {
  const initialSettings = {
    density,
    isConnected:
      props.points === undefined ? undefined : (props.isConnected ?? true),
  };

  if (features?.settings === false) {
    return <TrendSparklineFigure {...props} settings={initialSettings} />;
  }

  return (
    <ChartSettings
      initialSettings={initialSettings}
      label={`Settings for ${props.label}`}
      layout='inline'
      renderChart={(settings) => (
        <TrendSparklineFigure {...props} settings={settings} />
      )}
    />
  );
};
