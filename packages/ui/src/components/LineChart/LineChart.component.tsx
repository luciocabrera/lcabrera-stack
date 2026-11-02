import * as stylex from '@stylexjs/stylex';

import type { LineChartProps } from './LineChart.types';

import { LINE_CHART } from './LineChart.constants';
import { lineChartLayout } from './LineChart.stylex';
import { LineChartDataTable } from './LineChartDataTable/LineChartDataTable.component';
import { LineChartLegend } from './LineChartLegend/LineChartLegend.component';
import { LineChartMarkerLabels } from './LineChartMarkerLabels/LineChartMarkerLabels.component';
import { LineChartPlot } from './LineChartPlot/LineChartPlot.component';
import { LineChartTicks } from './LineChartTicks/LineChartTicks.component';
import { formatChartValue } from './utils/formatChartValue.util';
import { getLineChartGeometry } from './utils/getLineChartGeometry.util';

export const LineChart = ({
  description,
  hasDataTable,
  height = LINE_CHART.defaultHeight,
  markers,
  points = 'auto',
  series,
  title,
  xAxis,
  yAxis,
}: LineChartProps) => {
  const formatters = {
    x: xAxis?.format ?? formatChartValue,
    y: yAxis?.format ?? formatChartValue,
  };
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
      {yAxis?.label !== undefined && (
        <span
          {...stylex.props(lineChartLayout.axisLabel, lineChartLayout.yLabel)}
        >
          {yAxis.label}
        </span>
      )}
      <LineChartMarkerLabels markers={geometry.markers} />
      <LineChartTicks axis='y' ticks={geometry.yTicks} />
      <LineChartPlot
        description={description}
        geometry={geometry}
        height={height}
        title={title}
      />
      <LineChartTicks axis='x' ticks={geometry.xTicks} />
      {xAxis?.label !== undefined && (
        <span
          {...stylex.props(lineChartLayout.axisLabel, lineChartLayout.xLabel)}
        >
          {xAxis.label}
        </span>
      )}
      {geometry.series.length > 1 && (
        <LineChartLegend series={geometry.series} />
      )}
      {hasDataTable === true && (
        <LineChartDataTable
          formatters={formatters}
          series={series}
          title={title}
          xLabel={xAxis?.label}
          yLabel={yAxis?.label}
        />
      )}
    </div>
  );
};
