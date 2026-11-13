import { scaleLinear } from '@lcabrera/utils/chart/scale-linear.util';

import type {
  ChartX,
  LineChartFormatters,
  LineChartProps,
} from '#ui/components/LineChart/LineChart.types';

import { LINE_CHART } from '#ui/components/LineChart/LineChart.constants';

import { getChartDomains } from './getChartDomains.util';
import { getGridlinesPath } from './getGridlinesPath.util';
import { getMarkerGeometry } from './getMarkerGeometry.util';
import { getSeriesGeometry } from './getSeriesGeometry.util';
import { getSeriesTone } from './getSeriesTone.util';
import { getXTicks } from './getXTicks.util';
import { getYTicks } from './getYTicks.util';
import { positionTicks } from './positionTicks.util';

type GetLineChartGeometryArgs = Pick<
  LineChartProps,
  'markers' | 'series' | 'xAxis' | 'yAxis'
> & {
  readonly formatters: LineChartFormatters;
  readonly mode: NonNullable<LineChartProps['points']>;
  readonly tickCount?: number;
};

export const getLineChartGeometry = ({
  formatters,
  markers = [],
  mode,
  series,
  tickCount,
  xAxis,
  yAxis,
}: GetLineChartGeometryArgs) => {
  const domains = getChartDomains({
    markers,
    series,
    xDomain: xAxis?.domain,
    yDomain: yAxis?.domain,
  });
  const xScale = scaleLinear({
    domain: domains.x ?? LINE_CHART.unitDomain,
    range: [0, LINE_CHART.plotSize],
  });
  const scales = {
    x: (value: ChartX) => xScale(Number(value)),
    y: scaleLinear({
      domain: domains.y ?? LINE_CHART.unitDomain,
      range: [LINE_CHART.plotSize, 0],
    }),
  };
  const xTicks =
    domains.x === undefined
      ? []
      : positionTicks({
          format: formatters.x,
          scale: scales.x,
          ticks: getXTicks({
            domain: domains.x,
            isTime: domains.isTime,
            tickCount,
            ticks: xAxis?.ticks,
          }),
        });
  const yTicks =
    domains.y === undefined
      ? []
      : positionTicks({
          format: formatters.y,
          scale: scales.y,
          ticks: getYTicks({
            domain: domains.y,
            tickCount,
            ticks: yAxis?.ticks,
          }),
        });

  return {
    gridlines: getGridlinesPath({ ticks: yTicks }),
    markers: getMarkerGeometry({ markers, x: scales.x }),
    series: series.map((item, index) =>
      getSeriesGeometry({
        formatters,
        mode,
        scales,
        series: item,
        tone: getSeriesTone({ index, tone: item.tone }),
      }),
    ),
    xTicks,
    yTicks,
  };
};
