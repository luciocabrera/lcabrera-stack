import * as stylex from '@stylexjs/stylex';

import type { LineChartProps } from './LineChart.types';

import { LINE_CHART } from './LineChart.constants';
import { lineChartLayout } from './LineChart.stylex';
import { LineChartAxisLabel } from './LineChartAxisLabel/LineChartAxisLabel.component';
import { LineChartDataTable } from './LineChartDataTable/LineChartDataTable.component';
import { LineChartLegend } from './LineChartLegend/LineChartLegend.component';
import { LineChartMarkerLabels } from './LineChartMarkerLabels/LineChartMarkerLabels.component';
import { LineChartPlot } from './LineChartPlot/LineChartPlot.component';
import { LineChartTicks } from './LineChartTicks/LineChartTicks.component';
import { getLineChartFormatters } from './utils/getLineChartFormatters.util';
import { getLineChartGeometry } from './utils/getLineChartGeometry.util';

export const LineChart = ({
  description,
  hasDataTable,
  height = LINE_CHART.defaultHeight,
  markers,
  points = 'auto',
  series,
  title,
  xAxis = {},
  yAxis = {},
}: LineChartProps) => {
  const formatters = getLineChartFormatters({ xAxis, yAxis });
  const geometry = getLineChartGeometry({
    formatters,
    markers,
    mode: points,
    series,
    xAxis,
    yAxis,
  });

  return (
    <div {...stylex.props(lineChartLayout.root)}>
      <LineChartAxisLabel axis='y' label={yAxis.label} />
      <LineChartMarkerLabels markers={geometry.markers} />
      <LineChartTicks axis='y' ticks={geometry.yTicks} />
      <LineChartPlot
        description={description}
        geometry={geometry}
        height={height}
        title={title}
      />
      <LineChartTicks axis='x' ticks={geometry.xTicks} />
      <LineChartAxisLabel axis='x' label={xAxis.label} />
      <LineChartLegend series={geometry.series} />
      {hasDataTable === true && (
        <LineChartDataTable
          formatters={formatters}
          series={series}
          title={title}
          xLabel={xAxis.label}
          yLabel={yAxis.label}
        />
      )}
    </div>
  );
};
