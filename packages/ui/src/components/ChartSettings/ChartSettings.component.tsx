import * as stylex from '@stylexjs/stylex';

import type { ChartSettingsProps } from './ChartSettings.types';

import { chartSettingsStyles } from './ChartSettings.stylex';
import { ChartSettingsButton } from './ChartSettingsButton/ChartSettingsButton.component';
import { ChartSettingsChart } from './ChartSettingsChart/ChartSettingsChart.component';
import { ChartSettingsDrawer } from './ChartSettingsDrawer/ChartSettingsDrawer.component';
import { ChartSettingsProvider } from './contexts/ChartSettingsContext.provider';

export const ChartSettings = ({
  initialSettings,
  label,
  layout = 'block',
  renderChart,
}: ChartSettingsProps) => (
  <ChartSettingsProvider initialSettings={initialSettings} label={label}>
    {layout === 'block' ? (
      <div {...stylex.props(chartSettingsStyles.block)}>
        <div {...stylex.props(chartSettingsStyles.blockToolbar)}>
          <ChartSettingsButton />
        </div>
        <ChartSettingsChart renderChart={renderChart} />
      </div>
    ) : (
      <span {...stylex.props(chartSettingsStyles.inline)}>
        <ChartSettingsChart renderChart={renderChart} />
        <ChartSettingsButton />
      </span>
    )}
    <ChartSettingsDrawer />
  </ChartSettingsProvider>
);
