import { formatPathPoint } from '@lcabrera/utils/chart/format-path-point.util';
import { isFiniteChartValue } from '@lcabrera/utils/chart/is-finite-chart-value.util';
import { roundToCents } from '@lcabrera/utils/numbers/round-to-cents.util';

import type {
  ChartMarker,
  ChartX,
} from '#ui/components/LineChart/LineChart.types';

import {
  LINE_CHART,
  LINE_CHART_DEFAULT_TONE,
} from '#ui/components/LineChart/LineChart.constants';

import { isWithinPlot } from './isWithinPlot.util';

type GetMarkerGeometryArgs = {
  readonly markers: readonly ChartMarker[];
  readonly x: (value: ChartX) => number;
};

export const getMarkerGeometry = ({ markers, x }: GetMarkerGeometryArgs) =>
  markers
    .filter((marker) => isFiniteChartValue(marker.x))
    .map((marker, index) => {
      const at = roundToCents(x(marker.x));

      return {
        at,
        d: `M${formatPathPoint({ x: at, y: 0 })}L${formatPathPoint({ x: at, y: LINE_CHART.plotSize })}`,
        key: String(index),
        label: marker.label,
        to: marker.to,
        tone: marker.tone ?? LINE_CHART_DEFAULT_TONE,
      };
    })
    .filter(({ at }) => isWithinPlot(at));
