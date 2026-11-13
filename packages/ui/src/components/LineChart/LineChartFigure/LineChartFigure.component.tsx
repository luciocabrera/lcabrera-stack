import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';

import type { LineChartFigureProps } from '#ui/components/LineChart/LineChart.types';

import { scaleByDensity } from '#ui/components/ChartSettings/utils/scaleByDensity.util';
import { LINE_CHART } from '#ui/components/LineChart/LineChart.constants';

import { lineChartLayout } from '../LineChart.stylex';
import { LineChartAxisLabel } from '../LineChartAxisLabel/LineChartAxisLabel.component';
import { LineChartDataTable } from '../LineChartDataTable/LineChartDataTable.component';
import { LineChartLegend } from '../LineChartLegend/LineChartLegend.component';
import { LineChartMarkerLabels } from '../LineChartMarkerLabels/LineChartMarkerLabels.component';
import { LineChartPlot } from '../LineChartPlot/LineChartPlot.component';
import { LineChartTicks } from '../LineChartTicks/LineChartTicks.component';
import { getLineChartFormatters } from '../utils/getLineChartFormatters.util';
import { getLineChartGeometry } from '../utils/getLineChartGeometry.util';

export const LineChartFigure = ({
  description,
  hasDataTable,
  hasMarkerLabels,
  height = LINE_CHART.defaultHeight,
  markers,
  series,
  settings,
  title,
  xAxis = {},
  yAxis = {},
}: LineChartFigureProps) => {
  const formatters = getLineChartFormatters({ xAxis, yAxis });
  const geometry = getLineChartGeometry({
    formatters,
    markers,
    mode: settings.points ?? 'auto',
    series,
    tickCount: settings.tickCount,
    xAxis,
    yAxis,
  });
  const titleId = useId();

  return (
    <figure aria-labelledby={titleId} {...stylex.props(lineChartLayout.root)}>
      <LineChartAxisLabel axis='y' label={yAxis.label} />
      {(settings.hasMarkerLabels ?? hasMarkerLabels) === true && (
        <LineChartMarkerLabels markers={geometry.markers} />
      )}
      <LineChartTicks axis='y' ticks={geometry.yTicks} />
      <LineChartPlot
        description={description}
        geometry={geometry}
        height={scaleByDensity({ density: settings.density, size: height })}
        title={title}
        titleId={titleId}
      />
      <LineChartTicks axis='x' ticks={geometry.xTicks} />
      <LineChartAxisLabel axis='x' label={xAxis.label} />
      {settings.hasLegend !== false && (
        <LineChartLegend series={geometry.series} />
      )}
      {(hasDataTable === true || settings.isDataTableVisible === true) && (
        <LineChartDataTable
          formatters={formatters}
          isVisible={settings.isDataTableVisible === true}
          series={series}
          title={title}
          xLabel={xAxis.label}
          yLabel={yAxis.label}
        />
      )}
    </figure>
  );
};
