import { bandPath } from '@lcabrera/utils/chart/band-path.util';
import { decimate } from '@lcabrera/utils/chart/decimate.util';
import { linePath } from '@lcabrera/utils/chart/line-path.util';
import { roundToCents } from '@lcabrera/utils/numbers/round-to-cents.util';

import type {
  ChartTone,
  LineChartFormatters,
  LineChartPointsMode,
  LineChartScales,
  LineSeries,
} from '#ui/components/LineChart/LineChart.types';

import { LINE_CHART } from '#ui/components/LineChart/LineChart.constants';

import { getPointName } from './getPointName.util';
import { isDotDrawn } from './isDotDrawn.util';
import { isDrawnPoint } from './isDrawnPoint.util';
import { isWithinPlot } from './isWithinPlot.util';

type GetSeriesGeometryArgs = {
  readonly formatters: LineChartFormatters;
  readonly mode: LineChartPointsMode;
  readonly scales: LineChartScales;
  readonly series: LineSeries;
  readonly tone: ChartTone;
};

export const getSeriesGeometry = ({
  formatters,
  mode,
  scales,
  series,
  tone,
}: GetSeriesGeometryArgs) => {
  const drawn = series.points.filter((point) => isDrawnPoint(point));

  return {
    band: bandPath({ band: series.band ?? [], ...scales }),
    dots: drawn
      .filter((point) => isDotDrawn({ drawnCount: drawn.length, mode, point }))
      .map((point, index) => ({
        d: linePath({ points: [point], ...scales }),
        key: String(index),
        label: getPointName({ formatters, point, seriesLabel: series.label }),
        left: roundToCents(scales.x(point.x)),
        to: point.to,
        tone: point.tone ?? tone,
        top: roundToCents(scales.y(point.y)),
      }))
      .filter(({ left, top }) => isWithinPlot(left) && isWithinPlot(top)),
    id: series.id,
    isDashed: series.isDashed ?? false,
    label: series.label,
    line: linePath({
      points: decimate({
        points: series.points,
        threshold: LINE_CHART.decimateThreshold,
      }),
      ...scales,
    }),
    tone,
  };
};
